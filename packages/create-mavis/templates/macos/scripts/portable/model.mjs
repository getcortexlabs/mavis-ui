import ts from 'typescript'
import { preludePath, primitives } from './program.mjs'

// Swift keywords that cannot name a declaration, plus SwiftUI names a View member would shadow.
const swiftReserved = new Set(
  'associatedtype class deinit enum extension fileprivate func import init inout internal let operator private precedencegroup protocol public rethrows static struct subscript typealias var break case catch continue default defer do else fallthrough for guard if in repeat return throw switch where while Any as await false is nil self Self super throws true try body View State Binding Text Button Color Font Double String Bool Int Array Optional ForEach VStack HStack EmptyView'.split(
    ' ',
  ),
)
const jsReserved = new Set(['state', 'props', 'undefined', 'Math'])

export class PortableError extends Error {}

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
}
export const sameType = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const primitive = (type) => ['string', 'number', 'boolean'].includes(type.k)
const describe = (type) =>
  type.k === 'record'
    ? type.name
    : type.k === 'array'
      ? `${describe(type.of)}[]`
      : type.k === 'optional'
        ? `${describe(type.of)} | undefined`
        : type.k === 'function'
          ? `(${type.params.map(describe).join(', ')}) => void`
          : type.k

const stringMethods = {
  trim: [[], T.string],
  toLowerCase: [[], T.string],
  toUpperCase: [[], T.string],
  includes: [[T.string], T.boolean],
  startsWith: [[T.string], T.boolean],
  endsWith: [[T.string], T.boolean],
}
const mathFunctions = { min: 2, max: 2, floor: 1, ceil: 1, abs: 1, round: 1 }

/**
 * Builds the portable model from type-checked shared sources. Every construct is
 * checked here, before either generator writes a file.
 */
export function buildModel({ checker, sourceFile, relative }, paths) {
  const records = new Map()
  const components = new Map()
  const fail = (node, message) => {
    const file = node.getSourceFile()
    const { line, character } = file.getLineAndCharacterOfPosition(node.getStart(file))
    throw new PortableError(`${relative(file.fileName)}:${line + 1}:${character + 1}: ${message}`)
  }

  function mapType(type, node, { allowFunction = false } = {}) {
    if (type.flags & ts.TypeFlags.Union) {
      const parts = type.types.filter((part) => !(part.flags & ts.TypeFlags.Undefined))
      const optional = parts.length !== type.types.length
      let inner
      if (parts.every((part) => part.flags & ts.TypeFlags.StringLike)) inner = T.string
      else if (parts.every((part) => part.flags & ts.TypeFlags.BooleanLike)) inner = T.boolean
      else if (parts.every((part) => part.flags & ts.TypeFlags.NumberLike)) inner = T.number
      else if (parts.length === 1) inner = mapType(parts[0], node, { allowFunction })
      else fail(node, `Unsupported union type ${checker.typeToString(type)}.`)
      return optional ? T.optional(inner) : inner
    }
    if (type.flags & ts.TypeFlags.StringLike) return T.string
    if (type.flags & ts.TypeFlags.NumberLike) return T.number
    if (type.flags & ts.TypeFlags.BooleanLike) return T.boolean
    if (type.flags & ts.TypeFlags.Void) return T.void
    if (checker.isArrayType(type)) return T.array(mapType(checker.getTypeArguments(type)[0], node))
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
            mapType(checker.getTypeOfSymbolAtLocation(parameter, node), node),
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
      registerRecord(name, type, declaration)
      return T.record(name)
    }
    fail(node, `Unsupported type ${checker.typeToString(type)}.`)
  }

  function registerRecord(name, type, declaration) {
    const builtIn = relative(declaration.getSourceFile().fileName) === preludePath
    if (name === 'SelectOption' && !builtIn)
      fail(declaration, 'SelectOption is the Mavis option type; give yours another name.')
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
      const fieldType = mapType(checker.getTypeOfSymbolAtLocation(property, field), field)
      if (fieldType.k === 'function' || fieldType.k === 'void')
        fail(field, 'Record fields hold data, not functions.')
      record.fields.push({ name: property.name, type: fieldType })
    }
  }

  function selectOption() {
    if (!records.has('SelectOption')) {
      const declaration = sourceFile(preludePath).statements.find(
        (statement) =>
          ts.isTypeAliasDeclaration(statement) && statement.name.text === 'SelectOption',
      )
      registerRecord('SelectOption', checker.getTypeAtLocation(declaration.name), declaration)
    }
    return T.record('SelectOption')
  }

  function hasControl(node) {
    if (node.v === 'component') return true
    if (node.v === 'element') {
      if (['MButton', 'MInput', 'MCheckbox', 'MSelect'].includes(node.tag)) return true
      if (node.props.onClick || node.props.onKeyDown) return true
    }
    return [
      ...(node.children ?? []),
      ...(node.then ?? []),
      ...(node.else ?? []),
      ...(node.body ? [node.body] : []),
    ].some(hasControl)
  }

  // A boolean attribute written as a literal: animate, animate={true} or animate={false}.
  function flag(attribute) {
    if (!attribute) return false
    if (!attribute.initializer) return true
    const value = attributeValue(attribute)
    if (value.kind === ts.SyntaxKind.TrueKeyword) return true
    if (value.kind === ts.SyntaxKind.FalseKeyword) return false
    fail(attribute, 'animate is written as a literal: animate or animate={false}.')
  }

  function isLiteral(attribute) {
    if (!attribute.initializer) return true
    const value = attributeValue(attribute)
    return (
      ts.isStringLiteral(value) ||
      value.kind === ts.SyntaxKind.TrueKeyword ||
      value.kind === ts.SyntaxKind.FalseKeyword
    )
  }

  function checkName(node, name, what) {
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name))
      fail(node, `${what} ${name} needs a simple letters-and-digits name.`)
    if (swiftReserved.has(name) || jsReserved.has(name) || /^mavis/i.test(name))
      fail(node, `${what} ${name} collides with a reserved word in a generated target.`)
  }

  const typeOf = (node, options) => mapType(checker.getTypeAtLocation(node), node, options)

  for (const path of paths) {
    const file = sourceFile(path)
    if (!file) throw new PortableError(`${path}: Not found.`)
    if (path.endsWith('.lite.tsx')) components.set(path, readComponent(file, path))
    else readTypesFile(file)
  }

  function readTypesFile(file) {
    for (const statement of file.statements) {
      if (
        (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) &&
        statement.modifiers?.every((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
      )
        continue
      fail(statement, 'Type files contain only exported type declarations.')
    }
  }

  function readComponent(file, path) {
    const name = path.slice('shared/'.length, -'.lite.tsx'.length)
    if (!/^[A-Z][A-Za-z0-9]*$/.test(name))
      fail(
        file,
        `Component files are named after their component in PascalCase, e.g. TaskRow.lite.tsx.`,
      )
    let fn
    const imports = new Map()
    for (const statement of file.statements) {
      if (ts.isImportDeclaration(statement)) {
        const from = statement.moduleSpecifier.text
        const clause = statement.importClause
        if (from === '@builder.io/mitosis') {
          const named = clause?.namedBindings
          if (
            !named ||
            !ts.isNamedImports(named) ||
            clause.name ||
            named.elements.some(
              (element) =>
                element.propertyName ||
                !['useStore', 'useRef', 'Show', 'For'].includes(element.name.text),
            )
          )
            fail(statement, 'Import only { useStore, useRef, Show, For } from @builder.io/mitosis.')
          continue
        }
        if (!from.startsWith('./')) fail(statement, 'Import other shared files with ./ paths only.')
        if (clause?.isTypeOnly || (clause?.namedBindings && !clause.name)) continue
        if (!clause?.name || clause.namedBindings)
          fail(statement, 'Import one shared component as a default import.')
        const target = from.replace(/^\.\//, '').replace(/\.lite$/, '')
        if (clause.name.text !== target) fail(statement, `Import ${target} under its own name.`)
        imports.set(clause.name.text, `shared/${target}.lite.tsx`)
        continue
      }
      if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) continue
      if (ts.isFunctionDeclaration(statement)) {
        const modifiers = statement.modifiers?.map((modifier) => modifier.kind) ?? []
        if (
          fn ||
          modifiers.join() !== [ts.SyntaxKind.ExportKeyword, ts.SyntaxKind.DefaultKeyword].join()
        )
          fail(statement, 'A component file exports one default function component.')
        fn = statement
        continue
      }
      fail(statement, 'Only imports, type declarations and the component function are supported.')
    }
    if (!fn) fail(file, 'Export the component with export default function.')
    if (fn.name?.text !== name) fail(fn, `The component in ${name}.lite.tsx must be named ${name}.`)
    if (fn.asteriskToken || fn.typeParameters || fn.type || fn.parameters.length > 1)
      fail(fn, 'Use function Name(props: { ... }) without generics or a return type.')

    const component = {
      name,
      path,
      imports,
      props: [],
      state: [],
      getters: [],
      actions: [],
      view: null,
    }
    const members = new Map()
    const declare = (node, memberName, kind) => {
      checkName(node, memberName, kind)
      if (members.has(memberName) || imports.has(memberName) || memberName === name)
        fail(node, `${memberName} is already declared in ${name}.`)
      members.set(memberName, kind)
    }

    if (fn.parameters.length) {
      const parameter = fn.parameters[0]
      if (
        !ts.isIdentifier(parameter.name) ||
        parameter.name.text !== 'props' ||
        parameter.initializer
      )
        fail(parameter, 'Name the single parameter props.')
      const propsType = checker.getTypeAtLocation(parameter)
      for (const property of checker.getPropertiesOfType(propsType)) {
        const declaration = property.valueDeclaration ?? property.declarations?.[0]
        if (declaration && ts.isPropertySignature(declaration) && declaration.questionToken)
          fail(declaration, 'Optional properties are not supported yet; pass every property.')
        declare(declaration ?? parameter, property.name, 'Property')
        component.props.push({
          name: property.name,
          type: mapType(
            checker.getTypeOfSymbolAtLocation(property, parameter),
            declaration ?? parameter,
            { allowFunction: true },
          ),
        })
      }
    }

    const body = fn.body.statements
    let storeNode
    component.refs = []
    for (const statement of body.slice(0, -1)) {
      const list = ts.isVariableStatement(statement) ? statement.declarationList : null
      const declaration = list?.declarations[0]
      const call = declaration?.initializer
      if (
        !list ||
        list.flags !== ts.NodeFlags.Const ||
        list.declarations.length !== 1 ||
        !ts.isIdentifier(declaration.name) ||
        declaration.type ||
        !call ||
        !ts.isCallExpression(call)
      )
        fail(
          statement,
          'Before the returned JSX, declare only const state = useStore({ ... }) and const nameRef = useRef<MavisFieldRef>(null).',
        )
      const hook = call.expression.getText()
      if (hook === 'useStore') {
        if (
          storeNode ||
          declaration.name.text !== 'state' ||
          call.arguments.length !== 1 ||
          !ts.isObjectLiteralExpression(call.arguments[0])
        )
          fail(statement, 'Declare one const state = useStore({ ... }).')
        storeNode = call.arguments[0]
      } else if (hook === 'useRef') {
        const [typeArgument] = call.typeArguments ?? []
        if (
          typeArgument?.getText() !== 'MavisFieldRef' ||
          call.arguments.length > 1 ||
          (call.arguments[0] && call.arguments[0].kind !== ts.SyntaxKind.NullKeyword)
        )
          fail(statement, 'Field references are const nameRef = useRef<MavisFieldRef>(null).')
        declare(declaration, declaration.name.text, 'Ref')
        component.refs.push({ name: declaration.name.text, node: declaration })
      } else fail(call, 'Only useStore and useRef are supported here.')
    }
    const index = body.length - 1
    if (!body.length || !ts.isReturnStatement(body[index]) || !body[index].expression)
      fail(body[index] ?? fn, 'End the component by returning the screen as JSX.')

    const pending = []
    if (storeNode) {
      for (const member of storeNode.properties) {
        if (ts.isPropertyAssignment(member) && ts.isIdentifier(member.name)) {
          declare(member, member.name.text, 'State')
          pending.push(() =>
            component.state.push({
              name: member.name.text,
              type: typeOf(member.name),
              init: expr(
                member.initializer,
                scope(component, members, 'initializer'),
                typeOf(member.name),
              ),
            }),
          )
        } else if (ts.isGetAccessor(member) && ts.isIdentifier(member.name)) {
          declare(member, member.name.text, 'Getter')
          if (!member.body) fail(member, 'Getters need a body.')
          pending.push(() => {
            const type = typeOf(member.name)
            const ctx = scope(component, members, 'pure')
            const locals = []
            const statements = member.body.statements
            statements.slice(0, -1).forEach((statement) => locals.push(constant(statement, ctx)))
            const last = statements.at(-1)
            if (!last || !ts.isReturnStatement(last) || !last.expression)
              fail(
                member,
                'A getter is optional const declarations followed by return <expression>.',
              )
            component.getters.push({
              name: member.name.text,
              type,
              locals,
              expr: expr(last.expression, ctx, type),
            })
          })
        } else if (ts.isMethodDeclaration(member) && ts.isIdentifier(member.name)) {
          declare(member, member.name.text, 'Action')
          if (member.asteriskToken || member.typeParameters || member.questionToken)
            fail(member, 'Actions are plain methods.')
          if (member.modifiers?.length) fail(member, 'Actions cannot be async or have modifiers.')
          if (member.type && member.type.kind !== ts.SyntaxKind.VoidKeyword)
            fail(member.type, 'Actions return nothing.')
          const params = member.parameters.map((parameter) => {
            if (
              !ts.isIdentifier(parameter.name) ||
              parameter.initializer ||
              parameter.questionToken ||
              parameter.dotDotDotToken
            )
              fail(parameter, 'Action parameters are simple typed names.')
            if (!parameter.type) fail(parameter, 'Give each action parameter a type.')
            checkName(parameter, parameter.name.text, 'Parameter')
            return { name: parameter.name.text, type: typeOf(parameter) }
          })
          pending.push(() => {
            const ctx = scope(component, members, 'action')
            params.forEach((param) => ctx.locals.set(param.name, param.type))
            component.actions.push({
              name: member.name.text,
              params,
              body: block(member.body, ctx),
            })
          })
        } else
          fail(member, 'useStore members are state values, getters (get x()) or action methods.')
      }
    }
    component.members = members
    component.pending = pending
    component.render = body[index].expression
    return component
  }

  for (const component of components.values()) {
    for (const [importName, path] of component.imports)
      if (!components.has(path))
        fail(component.render, `${importName} is not a shared component file.`)
  }
  for (const component of components.values()) {
    for (const task of component.pending) task()
    component.view = view(component.render, scope(component, component.members, 'view'))
    for (const reference of component.refs) {
      if (!reference.field)
        fail(
          reference.node,
          `${reference.name} is not attached to an MInput with ref={${reference.name}}.`,
        )
      delete reference.node
      delete reference.field
    }
    delete component.pending
    delete component.shortcuts
    delete component.render
  }
  for (const record of records.values()) delete record.declaration
  return { records: [...records.values()], components: [...components.values()] }

  function scope(component, members, mode) {
    return { component, members, mode, locals: new Map() }
  }
  function child(ctx, mode = ctx.mode) {
    return { ...ctx, mode, locals: new Map(ctx.locals) }
  }

  function constant(statement, ctx) {
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
        ts.isVariableStatement(node)
        ? stmt(node, ctx)
        : [effect(node, ctx)]
    const statements = node.statements
    const out = []
    for (const statement of statements) out.push(...stmt(statement, ctx))
    return out
  }

  function stmt(node, ctx) {
    if (ts.isVariableStatement(node)) return [{ s: 'const', ...constant(node, ctx) }]
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
      return [
        {
          s: 'if',
          test,
          then: block(node.thenStatement, child(ctx)),
          else: node.elseStatement
            ? ts.isIfStatement(node.elseStatement)
              ? stmt(node.elseStatement, child(ctx))
              : block(node.elseStatement, child(ctx))
            : [],
        },
      ]
    }
    if (ts.isBlock(node)) return block(node, child(ctx))
    if (ts.isExpressionStatement(node)) return [effect(node.expression, ctx)]
    fail(node, 'Supported statements: const, if/else, return, state assignments and calls.')
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
    const local = sides.find((side) => ts.isIdentifier(side) && side.text !== 'undefined')
    const other = sides.find((side) => side !== local)
    if (!op || !local || !ts.isIdentifier(other) || other.text !== 'undefined') return null
    const type = ctx.locals.get(local.text)
    if (type?.k !== 'optional') return null
    return { op, name: local.text, inner: type.of }
  }

  function returnsOnly(node) {
    if (ts.isReturnStatement(node)) return !node.expression
    return ts.isBlock(node) && node.statements.length === 1 && returnsOnly(node.statements[0])
  }

  function statePath(node, ctx) {
    const fields = []
    let current = node
    while (ts.isPropertyAccessExpression(current) && !current.questionDotToken) {
      fields.unshift(current.name.text)
      current = current.expression
    }
    if (!ts.isIdentifier(current) || current.text !== 'state' || !fields.length)
      fail(node, 'Only state values and their record fields can be changed.')
    const [name, ...rest] = fields
    if (ctx.members.get(name) !== 'State') fail(node, `${name} is not a state value.`)
    return { name, fields: rest, type: typeOf(node) }
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
      const target = statePath(node.left, ctx)
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
      const target = statePath(node.operand, ctx)
      if (target.type.k !== 'number') fail(node, '++ and -- need a number.')
      return { s: 'assign', target, op, value: { e: 'lit', value: 1, type: T.number } }
    }
    if (ts.isCallExpression(node)) {
      const callee = node.expression
      if (ts.isPropertyAccessExpression(callee) && !callee.questionDotToken) {
        const owner = callee.expression
        const method = callee.name.text
        if (ts.isIdentifier(owner) && ctx.members.get(owner.text) === 'Ref') {
          if (!['focus', 'blur'].includes(method) || node.arguments.length)
            fail(callee, 'Field references support focus() and blur().')
          return { s: method, ref: owner.text }
        }
        if (ts.isIdentifier(owner) && owner.text === 'state') {
          if (ctx.members.get(method) !== 'Action') fail(callee, `${method} is not an action.`)
          const action = actionSignature(ctx.component, method, callee)
          return {
            s: 'action',
            name: method,
            args: args(
              node,
              action.map((p) => p.type),
              ctx,
            ),
          }
        }
        if (ts.isIdentifier(owner) && owner.text === 'props') {
          const prop = ctx.component.props.find((p) => p.name === method)
          if (prop?.type.k !== 'function') fail(callee, `${method} is not a callback property.`)
          return { s: 'callback', name: method, args: args(node, prop.type.params, ctx) }
        }
        if (['push', 'unshift', 'splice'].includes(method)) {
          const target = statePath(owner, ctx)
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
      fail(
        node,
        'Call actions with state.name(...), callbacks with props.name(...), or change arrays with push, unshift or splice.',
      )
    }
    fail(node, 'Supported statements: const, if/else, return, state assignments and calls.')
  }

  function actionSignature(component, name, node) {
    const store = component.actions.find((action) => action.name === name)
    if (store) return store.params
    // Declared later in the same store: read the signature from the type checker.
    const type = checker.getTypeAtLocation(node)
    const [signature] = type.getCallSignatures()
    return signature.parameters.map((parameter) => ({
      type: mapType(checker.getTypeOfSymbolAtLocation(parameter, node), node),
    }))
  }

  function args(node, types, ctx) {
    if (node.arguments.length !== types.length) fail(node, `Expected ${types.length} argument(s).`)
    return node.arguments.map((arg, i) => expr(arg, ctx, types[i]))
  }

  function expect(node, actual, expected) {
    if (!expected) return
    if (sameType(actual, expected)) return
    if (expected.k === 'optional' && sameType(actual, expected.of)) return
    fail(node, `Expected ${describe(expected)}, found ${describe(actual)}.`)
  }

  function expr(node, ctx, expected) {
    const result = build(node, ctx, expected)
    expect(node, result.type, expected)
    return result
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
    if (ts.isIdentifier(node)) {
      if (node.text === 'undefined') {
        if (expected?.k !== 'optional')
          fail(node, 'undefined is only allowed where a value is optional.')
        return { e: 'undefined', type: expected }
      }
      if (ctx.locals.has(node.text))
        return { e: 'local', name: node.text, type: ctx.locals.get(node.text) }
      fail(
        node,
        `${node.text} is not available here. Use state.name, props.name, locals or callback parameters.`,
      )
    }
    if (ts.isTemplateExpression(node)) {
      const parts = [node.head.text]
      for (const span of node.templateSpans) {
        const value = expr(span.expression, ctx)
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
      if (node.operator === ts.SyntaxKind.ExclamationToken)
        return { e: 'unary', op: '!', arg: expr(node.operand, ctx, T.boolean), type: T.boolean }
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
      return {
        e: 'cond',
        test,
        then: branch(node.whenTrue, narrow?.op === '!=='),
        else: branch(node.whenFalse, narrow?.op === '==='),
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
    const owner = node.expression
    const name = node.name.text
    if (ts.isIdentifier(owner) && owner.text === 'state' && !node.questionDotToken) {
      const kind = ctx.members.get(name)
      if (kind === 'State') return { e: 'state', name, type: typeOf(node) }
      if (kind === 'Getter') {
        if (ctx.mode === 'initializer') fail(node, 'Initial state cannot read getters.')
        return { e: 'getter', name, type: typeOf(node) }
      }
      if (kind === 'Action')
        fail(node, `Call ${name} as state.${name}(...) in an event handler or action.`)
      fail(node, `state.${name} is not declared.`)
    }
    if (ts.isIdentifier(owner) && owner.text === 'props' && !node.questionDotToken) {
      const prop = ctx.component.props.find((p) => p.name === name)
      if (!prop) fail(node, `props.${name} is not declared.`)
      if (prop.type.k === 'function')
        fail(node, `Call ${name} as props.${name}(...) in an event handler.`)
      return { e: 'prop', name, type: prop.type }
    }
    if (ctx.mode === 'initializer' && ts.isIdentifier(owner) && owner.text === 'state')
      fail(node, 'Initial state cannot read other state values.')
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
    if (ts.isIdentifier(callee.expression) && ['state', 'props'].includes(callee.expression.text))
      fail(
        node,
        'Actions and callbacks change things; call them from an event handler or action, not an expression.',
      )
    const object = expr(callee.expression, ctx)
    if (object.type.k === 'optional') fail(callee, 'This value may be undefined; check it first.')
    if (object.type.k === 'string') {
      const signature = stringMethods[method]
      if (!signature) fail(callee, `String method ${method} is not supported.`)
      return { e: 'call', method, object, args: args(node, signature[0], ctx), type: signature[1] }
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
          return { e: 'call', method, object, args: args(node, [element], ctx), type: T.boolean }
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
          return { e: 'call', method, object, args: args(node, [T.string], ctx), type: T.string }
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

  function binary(node, ctx, expected) {
    const kind = node.operatorToken.kind
    const K = ts.SyntaxKind
    if (kind === K.AmpersandAmpersandToken || kind === K.BarBarToken) {
      const op = kind === K.AmpersandAmpersandToken ? '&&' : '||'
      return {
        e: 'logical',
        op,
        left: expr(node.left, ctx, T.boolean),
        right: expr(node.right, ctx, T.boolean),
        type: T.boolean,
      }
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
      const leftUndefined = ts.isIdentifier(node.left) && node.left.text === 'undefined'
      const rightUndefined = ts.isIdentifier(node.right) && node.right.text === 'undefined'
      if (leftUndefined || rightUndefined) {
        const value = expr(leftUndefined ? node.right : node.left, ctx)
        if (value.type.k !== 'optional')
          fail(node, 'Only optional values can be compared with undefined.')
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

  function jsxName(node) {
    const tag = ts.isJsxElement(node) ? node.openingElement : node
    return { tag, name: tag.tagName.getText() }
  }

  function children(nodes, ctx) {
    const out = []
    for (const node of nodes) {
      if (ts.isJsxText(node)) {
        if (node.text.trim()) fail(node, 'Put text inside MText.')
        continue
      }
      if (ts.isJsxExpression(node)) {
        if (!node.expression) continue
        fail(
          node,
          'Use Show and For for conditional and repeated content; put values inside MText.',
        )
      }
      out.push(...viewNodes(node, ctx))
    }
    return out
  }

  function viewNodes(node, ctx) {
    if (ts.isParenthesizedExpression(node)) return viewNodes(node.expression, ctx)
    if (ts.isJsxFragment(node)) return children(node.children, ctx)
    return [view(node, ctx)]
  }

  function attributes(tag) {
    const result = new Map()
    for (const attribute of tag.attributes.properties) {
      if (!ts.isJsxAttribute(attribute) || !ts.isIdentifier(attribute.name))
        fail(attribute, 'Spread attributes are not supported.')
      if (result.has(attribute.name.text)) fail(attribute, `${attribute.name.text} is set twice.`)
      result.set(attribute.name.text, attribute)
    }
    return result
  }

  function attributeValue(attribute) {
    const init = attribute.initializer
    if (!init) fail(attribute, `${attribute.name.text} needs a value.`)
    if (ts.isStringLiteral(init)) return init
    if (ts.isJsxExpression(init) && init.expression) return init.expression
    fail(attribute, `${attribute.name.text} needs a value.`)
  }

  function view(node, ctx) {
    if (ts.isParenthesizedExpression(node)) return view(node.expression, ctx)
    if (ts.isJsxFragment(node)) fail(node, 'Return one root element.')
    if (!ts.isJsxElement(node) && !ts.isJsxSelfClosingElement(node))
      fail(node, 'Return JSX built from Mavis primitives, Show, For and shared components.')
    const { tag, name } = jsxName(node)
    const attrs = attributes(tag)
    const kids = ts.isJsxElement(node) ? node.children : []
    if (attrs.has('key') && !ctx.keyed)
      fail(attrs.get('key'), 'key belongs on the element returned by For.')
    if (name === 'Show') {
      for (const key of attrs.keys())
        if (!['when', 'else', 'animate'].includes(key))
          fail(attrs.get(key), `Show supports when, else and animate.`)
      if (!attrs.has('when')) fail(tag, 'Show needs when.')
      const animate = flag(attrs.get('animate'))
      // Revealed content keeps the column's spacing; a row would need another layout.
      if (animate && !['MColumn', 'MCard'].includes(ctx.parent?.tag))
        fail(attrs.get('animate'), 'An animated Show goes directly inside an MColumn or MCard.')
      const otherwise = attrs.has('else') ? attributeValue(attrs.get('else')) : null
      return {
        v: 'show',
        when: expr(attributeValue(attrs.get('when')), ctx, T.boolean),
        then: children(kids, { ...ctx, inShow: true }),
        else: otherwise ? viewNodes(otherwise, { ...ctx, inShow: true }) : [],
        ...(animate ? { animate: true, gap: ctx.parent.gap } : {}),
      }
    }
    if (name === 'For') {
      for (const key of attrs.keys())
        if (!['each', 'animate'].includes(key))
          fail(attrs.get(key), 'For supports each and animate.')
      const animate = flag(attrs.get('animate'))
      if (animate) {
        if (ctx.inFor) fail(attrs.get('animate'), 'Only a list outside other lists can animate.')
        if (!['MColumn', 'MRow'].includes(ctx.parent?.tag))
          fail(attrs.get('animate'), 'An animated For goes directly inside an MColumn or MRow.')
        if (ctx.parent.animated) fail(attrs.get('animate'), 'A stack can animate one list.')
        ctx.parent.animated = true
      }
      if (!attrs.has('each')) fail(tag, 'For needs each.')
      const each = expr(attributeValue(attrs.get('each')), ctx)
      if (each.type.k !== 'array') fail(attrs.get('each'), 'For needs an array.')
      const callbacks = kids.filter((kid) => !(ts.isJsxText(kid) && !kid.text.trim()))
      const callback =
        callbacks.length === 1 && ts.isJsxExpression(callbacks[0]) ? callbacks[0].expression : null
      if (
        !callback ||
        !ts.isArrowFunction(callback) ||
        ts.isBlock(callback.body) ||
        callback.parameters.length < 1 ||
        callback.parameters.length > 2
      )
        fail(
          tag,
          'For takes one child: {(item) => <Element key={item.id} ... />} or {(item, index) => ...}.',
        )
      const inner = child(ctx)
      const [itemName, indexName] = callback.parameters.map((parameter) => {
        if (!ts.isIdentifier(parameter.name) || parameter.initializer)
          fail(parameter, 'Use simple parameter names.')
        checkName(parameter, parameter.name.text, 'Parameter')
        return parameter.name.text
      })
      inner.locals.set(itemName, each.type.of)
      if (indexName) inner.locals.set(indexName, T.number)
      const body = callback.body
      const element = ts.isParenthesizedExpression(body) ? body.expression : body
      if (!ts.isJsxElement(element) && !ts.isJsxSelfClosingElement(element))
        fail(body, 'For returns one element with a key.')
      const keyAttribute = attributes(jsxName(element).tag).get('key')
      if (!keyAttribute)
        fail(element, 'Give the repeated element a key, for example key={task.id}.')
      const keyNode = attributeValue(keyAttribute)
      let key
      if (ts.isIdentifier(keyNode) && keyNode.text === itemName && primitive(each.type.of))
        key = null
      else if (
        ts.isPropertyAccessExpression(keyNode) &&
        ts.isIdentifier(keyNode.expression) &&
        keyNode.expression.text === itemName &&
        each.type.of.k === 'record'
      ) {
        const field = records
          .get(each.type.of.name)
          .fields.find((f) => f.name === keyNode.name.text)
        if (!field || !['string', 'number'].includes(field.type.k))
          fail(keyNode, 'The key must be a string or number field of the item.')
        key = field.name
      } else
        fail(
          keyNode,
          `Use a field of ${itemName} as key, for example key={${itemName}.id}, or the item itself for a list of strings or numbers.`,
        )
      inner.keyed = true
      inner.inFor = true
      const rendered = view(element, inner)
      return {
        v: 'for',
        each,
        item: itemName,
        index: indexName ?? null,
        key,
        body: rendered,
        ...(animate ? { animate: true } : {}),
      }
    }
    const keyed = ctx.keyed
    ctx = { ...ctx, keyed: false }
    const spec = primitives[name]
    if (spec) {
      const props = {}
      for (const [key, attribute] of attrs) {
        if (key === 'key') continue
        const kind = spec[key]
        if (!kind) fail(attribute, `${name} supports ${Object.keys(spec).join(', ')}.`)
        if (!attribute.initializer && kind === 'boolean') {
          props[key] = { expr: { e: 'lit', value: true, type: T.boolean } }
          continue
        }
        const value = attributeValue(attribute)
        switch (kind) {
          case 'space':
            if (!ts.isStringLiteral(value))
              fail(attribute, `${key} takes a spacing token name, for example ${key}="md".`)
            props[key] = { lit: value.text }
            break
          case 'string':
            props[key] = ts.isStringLiteral(value)
              ? { lit: value.text }
              : { expr: expr(value, ctx, T.string) }
            break
          case 'boolean':
            props[key] = { expr: expr(value, ctx, T.boolean) }
            break
          case 'number':
            props[key] = { expr: expr(value, ctx, T.number) }
            break
          case 'optional-string':
            props[key] = { expr: expr(value, ctx, T.optional(T.string)) }
            break
          case 'options':
            props[key] = { expr: expr(value, ctx, T.array(selectOption())) }
            break
          case 'handler':
            props[key] = handler(value, [], ctx)
            break
          case 'shortcut': {
            if (!ts.isStringLiteral(value))
              fail(attribute, 'shortcut is written as a literal, for example shortcut="mod+k".')
            if (ctx.inFor) fail(attribute, 'Repeated rows cannot share one shortcut.')
            // The shortcut exists while its button does; a hidden button would differ by target.
            if (ctx.inShow)
              fail(attribute, 'A button with a shortcut stays on screen; use disabled, not Show.')
            const taken = (ctx.component.shortcuts ??= new Set())
            if (taken.has(value.text))
              fail(attribute, `${value.text} is already used in this file.`)
            taken.add(value.text)
            props[key] = { lit: value.text }
            break
          }
          case 'string-handler':
          case 'key':
            props[key] = handler(value, [T.string], ctx)
            break
          case 'boolean-handler':
            props[key] = handler(value, [T.boolean], ctx)
            break
          case 'ref': {
            if (!ts.isIdentifier(value) || ctx.members.get(value.text) !== 'Ref')
              fail(attribute, 'ref takes a field reference declared with useRef.')
            if (ctx.inFor) fail(attribute, 'Repeated rows cannot share one field reference.')
            const reference = ctx.component.refs.find((ref) => ref.name === value.text)
            if (reference.field) fail(attribute, `${value.text} already belongs to another field.`)
            reference.field = true
            props[key] = { ref: value.text }
            break
          }
        }
      }
      for (const required of {
        MButton: ['text', 'onClick'],
        MInput: ['label', 'value', 'onChange'],
        MCheckbox: ['label', 'checked', 'onChange'],
        MSelect: ['label', 'value', 'options', 'onChange'],
      }[name] ?? [])
        if (!props[required]) fail(tag, `${name} needs ${required}.`)
      if (name === 'MInput') {
        // These choose the platform control, so they are fixed in the source.
        for (const fixed of ['type', 'multiline'])
          if (props[fixed] && !('lit' in props[fixed]) && !isLiteral(attrs.get(fixed)))
            fail(attrs.get(fixed), `${fixed} must be written as a literal value.`)
        const multiline = props.multiline && props.multiline.expr.value === true
        if (multiline && props.type && props.type.lit !== 'text')
          fail(attrs.get('type'), 'A multiline MInput is always type="text".')
        if (multiline && props.onSubmit)
          fail(
            attrs.get('onSubmit'),
            'Return adds a line in a multiline MInput; onSubmit needs a single-line field.',
          )
        if (props.rows && !multiline) fail(attrs.get('rows'), 'rows needs multiline.')
      }
      if ((name === 'MColumn' || name === 'MRow') && props.onKeyDown && !props.label)
        fail(tag, 'A stack that handles keys needs a label, so assistive technology can name it.')
      if (name === 'MCard' && props.onClick && !props.label)
        fail(tag, 'A card with onClick needs a label: it is announced as one button.')
      if (name === 'MText') {
        const parts = []
        for (const kid of kids) {
          if (ts.isJsxText(kid)) {
            const text = jsxText(kid.text)
            if (text) parts.push(text)
          } else if (ts.isJsxExpression(kid)) {
            if (!kid.expression) continue
            const value = expr(kid.expression, ctx)
            if (!primitive(value.type)) fail(kid, 'MText shows strings, numbers and booleans.')
            if (value.e === 'lit' && value.type.k === 'string') parts.push(value.value)
            else if (value.e === 'template') parts.push(...value.parts)
            else parts.push(value)
          } else fail(kid, 'MText contains text and values only.')
        }
        if (!parts.length) fail(tag, 'MText needs text.')
        return { v: 'text', props, parts, keyed }
      }
      if (
        !['MColumn', 'MRow', 'MGrid', 'MCard'].includes(name) &&
        kids.some((kid) => !(ts.isJsxText(kid) && !kid.text.trim()))
      )
        fail(node, `${name} takes no children; use its properties.`)
      const parent = { tag: name, gap: props.gap?.lit }
      const element = {
        v: 'element',
        tag: name,
        props,
        children: children(kids, { ...ctx, parent }),
        keyed,
      }
      // The whole card is one button; controls inside it could not be reached.
      if (name === 'MCard' && props.onClick && element.children.some(hasControl))
        fail(tag, 'A card with onClick shows text only; put buttons and fields outside it.')
      if (parent.animated) element.animatesList = true
      return element
    }
    const path = ctx.component.imports.get(name)
    if (!path) fail(tag, `${name} is not a Mavis primitive or an imported shared component.`)
    if (kids.some((kid) => !(ts.isJsxText(kid) && !kid.text.trim())))
      fail(node, 'Shared components do not take children yet.')
    const target = components.get(path)
    const props = []
    for (const prop of target.props) {
      const attribute = attrs.get(prop.name)
      if (!attribute) fail(tag, `${name} needs ${prop.name}.`)
      const value = attributeValue(attribute)
      props.push({
        name: prop.name,
        value:
          prop.type.k === 'function'
            ? { handler: handler(value, prop.type.params, ctx) }
            : { expr: expr(value, ctx, prop.type) },
      })
    }
    for (const key of attrs.keys())
      if (key !== 'key' && !target.props.some((prop) => prop.name === key))
        fail(attrs.get(key), `${name} has no property ${key}.`)
    return { v: 'component', name, props, keyed }
  }
}

/** JSX whitespace rules: trim around line breaks and join lines with one space. */
export function jsxText(raw) {
  const lines = raw.split(/\r\n|\n|\r/)
  let last = 0
  lines.forEach((line, i) => {
    if (/[^ \t]/.test(line)) last = i
  })
  let out = ''
  lines.forEach((line, i) => {
    const isFirst = i === 0
    const isLast = i === lines.length - 1
    let text = line.replace(/\t/g, ' ')
    if (!isFirst) text = text.replace(/^[ ]+/, '')
    if (!isLast) text = text.replace(/[ ]+$/, '')
    if (text) {
      if (i !== last) text += ' '
      out += text
    }
  })
  return out
}
