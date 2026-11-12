// The TSX front end: Name.lite.tsx in Mitosis's component format. A component is one default
// function with useStore for state, getters and actions, useRef for field references, and
// returned JSX built from Mavis primitives, Show, For and other shared components.
import ts from 'typescript'
import { components as primitives, listing, revealing } from '../components/index.mjs'
import { T } from '../model.mjs'

export const tsx = {
  name: 'TSX',
  extension: '.lite.tsx',
  open,
}

function open(reader, file, path) {
  const { checker, fail, checkName, mapType, typeOf, scope, child, expr, handler } = reader

  const dialect = {
    name(node) {
      fail(
        node,
        `${node.text} is not available here. Use state.name, props.name, locals or callback parameters.`,
      )
    },
    member(node, ctx) {
      const owner = node.expression
      const name = node.name.text
      if (ts.isIdentifier(owner) && owner.text === 'state' && !node.questionDotToken) {
        const kind = ctx.members.get(name)
        if (kind === 'State') return { e: 'state', name, type: reader.declaredType(node) }
        if (kind === 'Getter') {
          if (ctx.mode === 'initializer') fail(node, 'Initial state cannot read getters.')
          return { e: 'getter', name, type: reader.declaredType(node) }
        }
        if (kind === 'Action')
          fail(node, `Call ${name} as state.${name}(...) in an event handler or action.`)
        fail(node, `state.${name} is not declared.`)
      }
      if (ts.isIdentifier(owner) && owner.text === 'props' && !node.questionDotToken) {
        if (slotProps.has(name))
          fail(node, `${name} is a slot: show it among the elements, for example {props.${name}}.`)
        const prop = ctx.component.props.find((p) => p.name === name)
        if (!prop) fail(node, `props.${name} is not declared.`)
        if (prop.type.k === 'function')
          fail(node, `Call ${name} as props.${name}(...) in an event handler.`)
        return { e: 'prop', name, type: prop.type }
      }
      if (ctx.mode === 'initializer' && ts.isIdentifier(owner) && owner.text === 'state')
        fail(node, 'Initial state cannot read other state values.')
    },
    target(node, ctx) {
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
    },
    effect(node, ctx) {
      const callee = node.expression
      if (!ts.isPropertyAccessExpression(callee) || callee.questionDotToken) return
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
          args: reader.args(
            node,
            node.arguments,
            action.map((p) => p.type),
            ctx,
          ),
        }
      }
      if (ts.isIdentifier(owner) && owner.text === 'props') {
        const prop = ctx.component.props.find((p) => p.name === method)
        if (prop?.type.k !== 'function') fail(callee, `${method} is not a callback property.`)
        return {
          s: 'callback',
          name: method,
          args: reader.args(node, node.arguments, prop.type.params, ctx),
        }
      }
    },
    unknownEffect(node) {
      fail(
        node,
        'Call actions with state.name(...), callbacks with props.name(...), or change arrays with push, unshift or splice.',
      )
    },
    call(node) {
      const callee = node.expression
      if (
        ts.isPropertyAccessExpression(callee) &&
        !callee.questionDotToken &&
        ts.isIdentifier(callee.expression) &&
        ['state', 'props'].includes(callee.expression.text)
      )
        fail(
          node,
          'Actions and callbacks change things; call them from an event handler or action, not an expression.',
        )
    },
  }

  function slotName(prop) {
    if (prop === 'children') return 'default'
    if (/^slot[A-Z]/.test(prop)) return prop.charAt(4).toLowerCase() + prop.slice(5)
  }

  // JSX.Element (or a list of them) for a slot, or a function from its properties to one.
  function slotType(property, node) {
    const declared = checker.getTypeOfSymbolAtLocation(property, node)
    const parts = (declared.flags & ts.TypeFlags.Union ? declared.types : [declared]).filter(
      (part) => !(part.flags & ts.TypeFlags.Undefined),
    )
    const isElement = (type) =>
      type.getSymbol()?.name === 'Element' && type.getSymbol().parent?.name === 'JSX'
    const element = (type) =>
      isElement(type) || (checker.isArrayType(type) && isElement(checker.getTypeArguments(type)[0]))
    if (parts.length && parts.every(element)) return []
    const signatures = parts.length === 1 ? parts[0].getCallSignatures() : []
    if (
      signatures.length === 1 &&
      element(signatures[0].getReturnType()) &&
      signatures[0].parameters.length <= 1
    ) {
      const [param] = signatures[0].parameters
      return reader.slotParams(param && checker.getTypeOfSymbolAtLocation(param, node), node)
    }
    fail(
      node,
      `${property.name} is a slot: type it JSX.Element, or a function from what the slot hands its content to JSX.Element, for example slotRow?: (props: { item: Task }) => JSX.Element.`,
    )
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
    slots: [],
    state: [],
    getters: [],
    actions: [],
    view: null,
  }
  const members = new Map()
  const slotProps = new Map()
  const declaredSlots = []
  const declare = (node, memberName, kind) => {
    checkName(node, memberName, kind)
    if (members.has(memberName) || imports.has(memberName) || memberName === name)
      fail(node, `${memberName} is already declared in ${name}.`)
    members.set(memberName, kind)
  }
  const within = (mode) => scope(component, members, mode, dialect)

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
      // Mitosis's slots: children is the default one, slotHeader the one named header.
      const slot = slotName(property.name)
      if (slot) {
        slotProps.set(property.name, slot)
        declaredSlots.push({
          name: slot,
          params: slotType(property, declaration ?? parameter),
          node: declaration ?? parameter,
        })
        continue
      }
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
            init: expr(member.initializer, within('initializer'), typeOf(member.name)),
          }),
        )
      } else if (ts.isGetAccessor(member) && ts.isIdentifier(member.name)) {
        declare(member, member.name.text, 'Getter')
        if (!member.body) fail(member, 'Getters need a body.')
        pending.push(() => {
          const type = typeOf(member.name)
          const ctx = within('pure')
          const locals = []
          const statements = member.body.statements
          statements.slice(0, -1).forEach((statement) => locals.push(reader.local(statement, ctx)))
          const last = statements.at(-1)
          if (!last || !ts.isReturnStatement(last) || !last.expression)
            fail(member, 'A getter is optional const declarations followed by return <expression>.')
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
          const ctx = within('action')
          params.forEach((param) => ctx.locals.set(param.name, param.type))
          component.actions.push({
            name: member.name.text,
            params,
            body: reader.block(member.body, ctx),
          })
        })
      } else fail(member, 'useStore members are state values, getters (get x()) or action methods.')
    }
  }
  const render = body[index].expression
  // The slots in the order the view shows them, then the ones it never shows.
  const shownSlots = []
  const scan = (node) => {
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'props' &&
      slotProps.has(node.name.text)
    )
      shownSlots.push(slotProps.get(node.name.text))
    ts.forEachChild(node, scan)
  }
  scan(render)
  reader.declareSlots(component, [
    ...shownSlots.map((slot) => declaredSlots.find((item) => item.name === slot)),
    ...declaredSlots,
  ])

  return {
    component,
    link(find) {
      for (const [importName, importPath] of imports)
        if (!find(importPath)) fail(render, `${importName} is not a shared component file.`)
    },
    finish(find) {
      for (const task of pending) task()
      component.view = view(render, within('view'), find)
      for (const reference of component.refs) {
        if (!reference.field)
          fail(
            reference.node,
            `${reference.name} is not attached to an MInput with ref={${reference.name}}.`,
          )
        delete reference.node
        delete reference.field
      }
      delete component.shortcuts
    },
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

  function jsxName(node) {
    const tag = ts.isJsxElement(node) ? node.openingElement : node
    return { tag, name: tag.tagName.getText() }
  }

  function children(nodes, ctx, find) {
    const out = []
    for (const node of nodes) {
      if (ts.isJsxText(node)) {
        if (node.text.trim()) fail(node, 'Put text inside MText.')
        continue
      }
      if (ts.isJsxExpression(node)) {
        if (!node.expression) continue
        const slot = slotUse(node.expression, ctx, find)
        if (slot) {
          out.push(slot)
          continue
        }
        fail(
          node,
          'Use Show and For for conditional and repeated content; put values inside MText.',
        )
      }
      out.push(...viewNodes(node, ctx, find))
    }
    return out
  }

  // {props.children}, {props.slotHeader ?? <MText>…</MText>} and, for a scoped slot,
  // {props.slotRow({ item: task })}, with ?. when the slot is optional.
  function slotUse(expression, ctx, find) {
    let node = expression
    while (ts.isParenthesizedExpression(node)) node = node.expression
    let fallbackNode = null
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
    ) {
      fallbackNode = node.right
      node = node.left
      while (ts.isParenthesizedExpression(node)) node = node.expression
    }
    const call = ts.isCallExpression(node) ? node : null
    const access = call ? call.expression : node
    if (
      !ts.isPropertyAccessExpression(access) ||
      !ts.isIdentifier(access.expression) ||
      access.expression.text !== 'props' ||
      !slotProps.has(access.name.text)
    )
      return null
    const prop = access.name.text
    const name = slotProps.get(prop)
    const slot = component.slots.find((item) => item.name === name)
    if (!call && slot.params.length)
      fail(
        access,
        `The slot ${name} hands its content ${slot.params.map((param) => param.name).join(', ')}: show it as {props.${prop}?.({ ${slot.params.map((param) => `${param.name}: …`).join(', ')} })}.`,
      )
    const given = new Map()
    if (call) {
      const [object] = call.arguments
      if (call.arguments.length !== 1 || !ts.isObjectLiteralExpression(object))
        fail(call, `Hand the slot ${name} its properties as one object: {props.${prop}?.({ … })}.`)
      for (const property of object.properties) {
        if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name))
          given.set(property.name.text, property.initializer)
        else if (ts.isShorthandPropertyAssignment(property))
          given.set(property.name.text, property.name)
        else fail(property, 'Hand a slot its properties as name: value.')
      }
    }
    const fallback = fallbackNode ? viewNodes(fallbackNode, { ...ctx, inShow: true }, find) : []
    return reader.slotSite(component, name, given, fallback, expression, ctx)
  }

  function viewNodes(node, ctx, find) {
    if (ts.isParenthesizedExpression(node)) return viewNodes(node.expression, ctx, find)
    if (ts.isJsxFragment(node)) return children(node.children, ctx, find)
    return [view(node, ctx, find)]
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

  function view(node, ctx, find) {
    if (ts.isParenthesizedExpression(node)) return view(node.expression, ctx, find)
    if (ts.isJsxFragment(node)) fail(node, 'Return one root element.')
    if (!ts.isJsxElement(node) && !ts.isJsxSelfClosingElement(node))
      fail(node, 'Return JSX built from Mavis primitives, Show, For and shared components.')
    const { tag, name: tagName } = jsxName(node)
    const attrs = attributes(tag)
    const kids = ts.isJsxElement(node) ? node.children : []
    if (attrs.has('key') && !ctx.keyed)
      fail(attrs.get('key'), 'key belongs on the element returned by For.')
    if (tagName === 'Show') {
      for (const key of attrs.keys())
        if (!['when', 'else', 'animate'].includes(key))
          fail(attrs.get(key), `Show supports when, else and animate.`)
      if (!attrs.has('when')) fail(tag, 'Show needs when.')
      const animate = flag(attrs.get('animate'))
      // Revealed content keeps the column's spacing; a row would need another layout.
      if (animate && !primitives[ctx.parent?.tag]?.reveals)
        fail(attrs.get('animate'), `An animated Show goes directly inside an ${revealing}.`)
      const otherwise = attrs.has('else') ? attributeValue(attrs.get('else')) : null
      return {
        v: 'show',
        when: expr(attributeValue(attrs.get('when')), ctx, T.boolean),
        then: children(kids, { ...ctx, inShow: true }, find),
        else: otherwise ? viewNodes(otherwise, { ...ctx, inShow: true }, find) : [],
        ...(animate ? { animate: true, gap: ctx.parent.gap } : {}),
      }
    }
    if (tagName === 'For') {
      for (const key of attrs.keys())
        if (!['each', 'animate'].includes(key))
          fail(attrs.get(key), 'For supports each and animate.')
      const animate = flag(attrs.get('animate'))
      if (animate) {
        if (ctx.inFor) fail(attrs.get('animate'), 'Only a list outside other lists can animate.')
        if (!primitives[ctx.parent?.tag]?.animatesList)
          fail(attrs.get('animate'), `An animated For goes directly inside an ${listing}.`)
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
      const callbackBody = callback.body
      const element = ts.isParenthesizedExpression(callbackBody)
        ? callbackBody.expression
        : callbackBody
      if (!ts.isJsxElement(element) && !ts.isJsxSelfClosingElement(element))
        fail(callbackBody, 'For returns one element with a key.')
      const keyAttribute = attributes(jsxName(element).tag).get('key')
      if (!keyAttribute)
        fail(element, 'Give the repeated element a key, for example key={task.id}.')
      const key = reader.listKey(attributeValue(keyAttribute), itemName, each)
      inner.keyed = true
      inner.inFor = true
      const rendered = view(element, inner, find)
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
    const spec = primitives[tagName]
    if (spec) {
      const props = reader.properties(tagName, attrs, tag, ctx, {
        value: (attribute) => (attribute.initializer ? attributeValue(attribute) : undefined),
        isLiteral,
      })
      if (spec.children === 'text') {
        const parts = []
        for (const kid of kids) {
          if (ts.isJsxText(kid)) {
            const text = jsxText(kid.text)
            if (text) parts.push(text)
          } else if (ts.isJsxExpression(kid)) {
            if (!kid.expression) continue
            reader.shown(parts, expr(kid.expression, ctx), kid)
          } else fail(kid, 'MText contains text and values only.')
        }
        if (!parts.length) fail(tag, 'MText needs text.')
        return { v: 'text', tag: tagName, props, parts, keyed }
      }
      if (!spec.children && kids.some((kid) => !(ts.isJsxText(kid) && !kid.text.trim())))
        fail(node, `${tagName} takes no children; use its properties.`)
      const parent = { tag: tagName, gap: props.gap }
      const element = {
        v: 'element',
        tag: tagName,
        props,
        children: children(kids, { ...ctx, parent }, find),
        keyed,
      }
      spec.checkChildren?.({ tag, element, fail, hasControl: reader.hasControl })
      if (parent.animated) element.animatesList = true
      return element
    }
    const importPath = ctx.component.imports.get(tagName)
    if (!importPath)
      fail(tag, `${tagName} is not a Mavis primitive or an imported shared component.`)
    const target = find(importPath).component
    const props = []
    for (const prop of target.props) {
      const attribute = attrs.get(prop.name)
      if (!attribute) fail(tag, `${tagName} needs ${prop.name}.`)
      const value = attributeValue(attribute)
      props.push({
        name: prop.name,
        value:
          prop.type.k === 'function'
            ? { handler: handler(value, prop.type.params, ctx) }
            : { expr: expr(value, ctx, prop.type) },
      })
    }
    const fills = []
    // Content for a scoped slot is a function of what the slot hands it: ({ item }) => <…/>.
    const fill = (name, value, at) => {
      if (ts.isArrowFunction(value)) {
        if (value.parameters.length > 1 || ts.isBlock(value.body))
          fail(value, `Pass ${name} as ({ item }) => <…/>: one parameter and JSX.`)
        return reader.slotContent(target, name, value.parameters[0], at, ctx, (inner) =>
          viewNodes(value.body, inner, find),
        )
      }
      return reader.slotContent(target, name, undefined, at, ctx, (inner) =>
        viewNodes(value, inner, find),
      )
    }
    const content = kids.filter((kid) => !(ts.isJsxText(kid) && !kid.text.trim()))
    if (content.length) {
      const [only] = content
      fills.push(
        content.length === 1 &&
          ts.isJsxExpression(only) &&
          only.expression &&
          ts.isArrowFunction(only.expression)
          ? fill('default', only.expression, only)
          : reader.slotContent(target, 'default', undefined, tag, ctx, (inner) =>
              children(content, inner, find),
            ),
      )
    }
    for (const [key, attribute] of attrs) {
      if (key === 'children')
        fail(attribute, `Pass the default slot of ${tagName} as its children.`)
      const name = slotName(key)
      if (name) fills.push(fill(name, attributeValue(attribute), attribute))
      else if (key !== 'key' && !target.props.some((prop) => prop.name === key))
        fail(attribute, `${tagName} has no property ${key}.`)
    }
    const order = target.slots.map((slot) => slot.name)
    fills.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))
    return { v: 'component', name: tagName, props, slots: fills, keyed }
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
