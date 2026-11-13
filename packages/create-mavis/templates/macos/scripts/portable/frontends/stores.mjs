// Stores: state a module owns and many components share. A store is a function called
// create… that takes the host services it needs, declares state with ref, values with computed
// and functions, and returns what it shares; a key and a use… function hand it to components,
// as Vue's provide and inject do on the Web and NativeScript. On the Mac it is an @Observable
// class the app creates once.
import ts from 'typescript'

const calls = (node, name) =>
  Boolean(node) &&
  ts.isCallExpression(node) &&
  ts.isIdentifier(node.expression) &&
  (name ? node.expression.text === name : true)
const shape =
  'A store declares state with ref, values with computed and functions, then returns what it shares: return { items, add }.'

/** What a store is written with, for the checker: the part of vue a shared module may use. */
export const storeAmbient = `declare module 'vue' {
  export interface Ref<T = any> { value: T; readonly __mavisRef: true }
  export interface ComputedRef<T = any> { readonly value: T; readonly __mavisRef: true }
  export interface InjectionKey<T> extends Symbol { readonly __mavisKey?: T }
  export function ref<T>(value: T): Ref<T>
  export function ref<T = undefined>(): Ref<T | undefined>
  export function computed<T>(getter: () => T): ComputedRef<T>
  export function readonly<T>(value: Ref<T> | ComputedRef<T>): ComputedRef<T>
  export function inject<T>(key: InjectionKey<T>): T | undefined
  export function watch<T>(source: Ref<T> | ComputedRef<T> | (() => T), callback: (value: T, before: T) => void | Promise<void>): void
  export function onMounted(hook: () => void | Promise<void>): void
  export function onUnmounted(hook: () => void): void
  export function onBeforeUnmount(hook: () => void): void
}
`

/** Whether a function of a module is a store. */
export function isStore(fn) {
  const body = fn.body && ts.isBlock(fn.body) ? fn.body.statements : []
  const last = body.at(-1)
  return Boolean(
    last &&
    ts.isReturnStatement(last) &&
    last.expression &&
    ts.isObjectLiteralExpression(last.expression) &&
    body.some(
      (statement) =>
        ts.isVariableStatement(statement) &&
        statement.declarationList.declarations.some(
          (each) => calls(each.initializer, 'ref') || calls(each.initializer, 'computed'),
        ),
    ),
  )
}

/** const key: InjectionKey<Cart> = Symbol('cart'): the function whose store the key carries. */
export function keyOf(declaration, checker) {
  if (!calls(declaration.initializer, 'Symbol') || !declaration.type) return null
  const [carried] = ts.isTypeReferenceNode(declaration.type)
    ? (declaration.type.typeArguments ?? [])
    : []
  if (declaration.type.typeName?.getText() !== 'InjectionKey' || !carried) return null
  // Cart = ReturnType<typeof createCart>
  let node = carried
  const alias =
    ts.isTypeReferenceNode(node) && checker.getSymbolAtLocation(node.typeName)?.declarations?.[0]
  if (alias && ts.isTypeAliasDeclaration(alias)) node = alias.type
  const [query] = ts.isTypeReferenceNode(node) ? (node.typeArguments ?? []) : []
  return query && ts.isTypeQueryNode(query) && node.typeName.getText() === 'ReturnType'
    ? query.exprName.getText()
    : null
}

/**
 * function useCart() { const cart = inject(cartKey); if (!cart) throw new Error('…'); return cart }
 * The key it reads, or null when the function is something else.
 */
export function accessorOf(fn) {
  const body = fn.body && ts.isBlock(fn.body) ? fn.body.statements : []
  const [first, check, last] = body
  const declared = first && ts.isVariableStatement(first) && first.declarationList.declarations[0]
  if (body.length !== 3 || !declared || !calls(declared.initializer, 'inject')) return null
  const [key] = declared.initializer.arguments
  const held = declared.name.getText()
  if (
    !key ||
    !ts.isIdentifier(key) ||
    !ts.isIfStatement(check) ||
    check.expression.getText() !== `!${held}` ||
    !ts.isReturnStatement(last) ||
    last.expression?.getText() !== held
  )
    return null
  return key.text
}

/** Reads one store of a module: what it is first, its values and bodies in finish. */
export function openStore(reader, module, nameNode, fn, exported) {
  const { checker, fail, checkName, mapType, typeOf } = reader
  const factory = nameNode.text
  if (!/^create[A-Z][A-Za-z0-9]*$/.test(factory))
    fail(nameNode, `Name the function that makes a store create…, for example createCart.`)
  const name = factory.slice('create'.length)
  checkName(nameNode, name, 'Store')
  const store = {
    name,
    module: module.name,
    factory,
    exported,
    deps: [],
    state: [],
    getters: [],
    actions: [],
    shares: [],
    async: new Set(),
  }
  const members = new Map()
  const signatures = new Map()
  const pending = []
  const declare = (node, memberName, kind) => {
    checkName(node, memberName, kind)
    if (members.has(memberName)) fail(node, `${memberName} is already declared in ${factory}.`)
    members.set(memberName, kind)
  }
  const own = (node, ctx) =>
    ts.isIdentifier(node) && !ctx.locals.has(node.text) ? members.get(node.text) : undefined
  const read = (node, kind, memberName) => ({
    e: kind === 'Getter' ? 'getter' : 'state',
    name: memberName,
    type: reader.declaredType(node),
  })
  const dialect = {
    nullish: true,
    truthy: true,
    name(node, ctx) {
      const kind = own(node, ctx)
      // let kept = 0: a value of the store nobody outside sees, read by its name.
      if (kind === 'Kept') {
        if (ctx.mode === 'initializer')
          fail(node, 'An initial value cannot read the store: on the Mac nothing of it exists yet.')
        return { e: 'state', name: node.text, type: reader.declaredType(node) }
      }
      if (kind === 'State' || kind === 'Getter') fail(node, `Read ${node.text}.value.`)
      if (kind === 'Action') fail(node, `Call ${node.text}(…) from another function of the store.`)
      fail(node, `${node.text} is not available in a store.`)
    },
    member(node, ctx) {
      const kind = own(node.expression, ctx)
      if (node.name.text !== 'value' || node.questionDotToken) return undefined
      if (kind !== 'State' && kind !== 'Getter') return undefined
      if (ctx.mode === 'initializer')
        fail(node, 'An initial value cannot read the store: on the Mac nothing of it exists yet.')
      return read(node, kind, node.expression.text)
    },
    target(node, ctx) {
      const fields = []
      let current = node
      while (ts.isPropertyAccessExpression(current) && !current.questionDotToken) {
        if (current.name.text === 'value' && own(current.expression, ctx) === 'State')
          return { name: current.expression.text, fields, type: typeOf(node) }
        fields.unshift(current.name.text)
        current = current.expression
      }
      if (own(current, ctx) === 'Kept') return { name: current.text, fields, type: typeOf(node) }
      fail(node, 'Only a ref of the store and the fields of its value can be changed.')
    },
    effect(node, ctx) {
      const called = node.expression
      if (own(called, ctx) === 'Action')
        return {
          s: 'action',
          name: called.text,
          args: reader.args(
            node,
            node.arguments,
            signatures.get(called.text).map((param) => param.type),
            ctx,
          ),
        }
      if (ts.isPropertyAccessExpression(called) && own(called.expression, ctx) === 'Dep')
        return reader.serviceCall(
          node,
          store.deps.find((dep) => dep.name === called.expression.text),
          ctx,
        )
      return undefined
    },
    unknownEffect(node) {
      fail(node, 'Call a function of the store, or a service it was given.')
    },
  }
  const within = (mode) => reader.scope(store, members, mode, dialect)

  for (const parameter of fn.parameters) {
    if (!ts.isIdentifier(parameter.name) || !parameter.type || parameter.initializer)
      fail(parameter, 'A store takes the host services it needs as typed parameters.')
    const type = typeOf(parameter.name)
    if (type.k !== 'service')
      fail(
        parameter,
        'A store takes host services: type the parameter with an interface of methods the host implements.',
      )
    declare(parameter, parameter.name.text, 'Dep')
    store.deps.push({ name: parameter.name.text, service: type.name })
  }

  function action(nameAt, node) {
    const waits = Boolean(node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword))
    if (node.asteriskToken || node.typeParameters)
      fail(nameAt, 'A function of a store is a plain function: no generics or generators.')
    const returned = checker.getReturnTypeOfSignature(checker.getSignatureFromDeclaration(node))
    const result = waits ? (checker.getAwaitedType(returned) ?? returned) : returned
    if (!(result.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined)))
      fail(
        nameAt,
        `${nameAt.text} returns a value. A function of a store changes its state and returns nothing; share values with computed.`,
      )
    const params = node.parameters.map((parameter) => {
      if (
        !ts.isIdentifier(parameter.name) ||
        !parameter.type ||
        parameter.initializer ||
        parameter.questionToken ||
        parameter.dotDotDotToken
      )
        fail(parameter, 'Function parameters are simple typed names.')
      checkName(parameter, parameter.name.text, 'Parameter')
      return { name: parameter.name.text, type: typeOf(parameter.name) }
    })
    if (waits) store.async.add(nameAt.text)
    signatures.set(nameAt.text, params)
    pending.push(() => {
      const ctx = { ...within('action'), failing: true, async: waits }
      params.forEach((param) => ctx.locals.set(param.name, param.type))
      store.actions.push({
        name: nameAt.text,
        params,
        body: reader.block(node.body, ctx),
        ...(waits ? { async: true } : {}),
      })
    })
  }

  const body = fn.body.statements
  for (const statement of body.slice(0, -1)) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      declare(statement.name, statement.name.text, 'Action')
      action(statement.name, statement)
      continue
    }
    if (!ts.isVariableStatement(statement)) fail(statement, shape)
    const kept = Boolean(statement.declarationList.flags & ts.NodeFlags.Let)
    if (!kept && !(statement.declarationList.flags & ts.NodeFlags.Const)) fail(statement, shape)
    for (const declaration of statement.declarationList.declarations) {
      const { initializer } = declaration
      if (!ts.isIdentifier(declaration.name)) fail(declaration, shape)
      const memberName = declaration.name.text
      if (kept) {
        declare(declaration.name, memberName, 'Kept')
        pending.push(() => {
          const type = typeOf(declaration.name)
          if (!initializer && type.k !== 'optional')
            fail(declaration, 'Give this value of the store a start: let count = 0.')
          store.state.push({
            name: memberName,
            type,
            init: initializer
              ? reader.own(reader.expr(initializer, within('initializer'), type), initializer)
              : { e: 'undefined', type },
            kept: true,
          })
        })
        continue
      }
      if (!initializer) fail(declaration, shape)
      if (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) {
        declare(declaration.name, memberName, 'Action')
        action(declaration.name, initializer)
        continue
      }
      const held = () =>
        mapType(
          checker.getTypeOfPropertyOfType(checker.getTypeAtLocation(declaration.name), 'value'),
          declaration.name,
        )
      if (calls(initializer, 'ref')) {
        declare(declaration.name, memberName, 'State')
        const [initial] = initializer.arguments
        pending.push(() => {
          const type = held()
          if (!initial && type.k !== 'optional') fail(initializer, 'Give ref an initial value.')
          store.state.push({
            name: memberName,
            type,
            init: initial
              ? reader.own(reader.expr(initial, within('initializer'), type), initial)
              : { e: 'undefined', type },
          })
        })
      } else if (calls(initializer, 'computed')) {
        declare(declaration.name, memberName, 'Getter')
        const [getter] = initializer.arguments
        if (!getter || !ts.isArrowFunction(getter) || getter.parameters.length)
          fail(initializer, 'computed takes a function that returns the value.')
        pending.push(() => {
          const type = held()
          const ctx = within('pure')
          const locals = []
          let result = getter.body
          if (ts.isBlock(getter.body)) {
            const list = getter.body.statements
            list.slice(0, -1).forEach((each) => locals.push(reader.local(each, ctx)))
            const last = list.at(-1)
            if (!last || !ts.isReturnStatement(last) || !last.expression)
              fail(getter, 'A computed value is const declarations followed by return.')
            result = last.expression
          }
          store.getters.push({
            name: memberName,
            type,
            locals,
            expr: reader.expr(result, ctx, type),
          })
        })
      } else fail(declaration, shape)
    }
  }
  for (const property of body.at(-1).expression.properties) {
    const shared = property.name?.getText()
    if (ts.isMethodDeclaration(property) && ts.isIdentifier(property.name)) {
      declare(property.name, shared, 'Action')
      action(property.name, property)
      store.shares.push({ name: shared, kind: 'action' })
      continue
    }
    let value = ts.isShorthandPropertyAssignment(property)
      ? property.name
      : ts.isPropertyAssignment(property)
        ? property.initializer
        : fail(property, shape)
    const guarded = calls(value, 'readonly')
    if (guarded) [value] = value.arguments
    const kind = value && ts.isIdentifier(value) ? members.get(value.text) : undefined
    if (!kind || kind === 'Dep' || kind === 'Kept' || value.text !== shared)
      fail(
        property,
        `Share a ref, a computed value or a function of the store under its own name: ${shared}, or ${shared}: readonly(${shared}).`,
      )
    store.shares.push({
      name: shared,
      kind: kind === 'State' ? 'state' : kind === 'Getter' ? 'getter' : 'action',
      ...(guarded ? { readonly: true } : {}),
    })
  }
  return {
    store,
    finish() {
      for (const task of pending) task()
      reader.markFailing(store)
      delete store.async
    },
  }
}

// A component's names for what stores share, taken apart: const { items, add } = useCart().
const taken = new WeakMap()

/**
 * What a component does with stores, for every front end. reader.stores maps a store's name to
 * its model; tools are the reader's expr, args, fail and typeOf.
 */
export function storeUse(reader, tools) {
  const { fail, args } = tools
  const local = (node, ctx) =>
    ts.isIdentifier(node) && !ctx.locals.has(node.text) ? node.text : undefined
  const held = (ctx, name) => ctx.component.stores?.find((each) => each.name === name)
  // local.member, or a member taken apart: { use, share }.
  function shared(node, ctx) {
    if (ts.isPropertyAccessExpression(node) && !node.questionDotToken) {
      const use = held(ctx, local(node.expression, ctx))
      if (!use) return undefined
      const share = reader.stores.get(use.store).shares.find((s) => s.name === node.name.text)
      if (!share) fail(node, `${use.store} does not share ${node.name.text}.`)
      return { use, share }
    }
    const alias = taken.get(ctx.component)?.get(local(node, ctx))
    if (!alias) return undefined
    const use = held(ctx, alias.store)
    return { use, share: reader.stores.get(use.store).shares.find((s) => s.name === alias.member) }
  }
  const typeOfShare = ({ use, share }) => {
    const store = reader.stores.get(use.store)
    return [...store.state, ...store.getters].find((each) => each.name === share.name).type
  }
  const value = (found) => ({
    e: 'store',
    store: found.use.name,
    name: found.share.name,
    type: typeOfShare(found),
  })
  return {
    /** const cart = useCart(), or const { items, add } = useCart(): true when it was one. */
    bind(component, declaration, declare) {
      const call = declaration.initializer
      const accessor = calls(call) ? reader.moduleMember(call.expression) : undefined
      if (accessor?.kind !== 'accessor') return false
      if (call.arguments.length) fail(call, `${call.expression.text}() takes no arguments.`)
      const store = reader.stores.get(accessor.store)
      component.stores ??= []
      const use = (name) => {
        if (!component.stores.some((each) => each.name === name))
          component.stores.push({
            name,
            store: store.name,
            module: store.module,
            accessor: accessor.name,
          })
      }
      if (ts.isIdentifier(declaration.name)) {
        declare(declaration, declaration.name.text, 'Store')
        use(declaration.name.text)
        return true
      }
      if (!ts.isObjectBindingPattern(declaration.name))
        fail(declaration, 'Take a store whole, or its members apart by name.')
      const whole = `mavis${store.name}`
      use(whole)
      if (!taken.has(component)) taken.set(component, new Map())
      for (const element of declaration.name.elements) {
        const member = (element.propertyName ?? element.name).getText()
        if (!ts.isIdentifier(element.name) || element.initializer || element.dotDotDotToken)
          fail(element, 'Take each member of the store by its name.')
        if (!store.shares.some((share) => share.name === member))
          fail(element, `${store.name} does not share ${member}.`)
        declare(element, element.name.text, 'Shared')
        taken.get(component).set(element.name.text, { store: whole, member })
      }
      return true
    },
    /** cart.items.value, items.value, or items where the format unwraps it. */
    read(node, ctx) {
      if (!ctx.component.stores) return undefined
      if (ts.isPropertyAccessExpression(node) && node.name.text === 'value') {
        const found = !node.questionDotToken && shared(node.expression, ctx)
        if (found && found.share.kind !== 'action') {
          if (ctx.mode === 'initializer')
            fail(
              node,
              'An initial value cannot read a store: on the Mac the component does not have it yet. Compute the value with computed.',
            )
          return value(found)
        }
        return undefined
      }
      const found = shared(node, ctx)
      if (!found) {
        if (held(ctx, local(node, ctx)))
          fail(node, `Read what ${node.text} shares by name: ${node.text}.name.value.`)
        return undefined
      }
      const text = node.getText()
      if (found.share.kind === 'action') fail(node, `Call ${text}(…) from a handler or a function.`)
      if (ts.isIdentifier(node) && ctx.dialect.unwraps) return value(found)
      fail(node, `Read ${text}.value.`)
    },
    /** What an assignment changes, when it is a store's state. */
    target(node, ctx) {
      if (!ctx.component.stores) return undefined
      const fields = []
      let current = node
      while (ts.isPropertyAccessExpression(current) && !current.questionDotToken) {
        const found =
          current.name.text === 'value' ? shared(current.expression, ctx) : shared(current, ctx)
        const bare = current.name.text !== 'value'
        if (found && found.share.kind === 'state') {
          if (bare) fail(node, `Change ${current.getText()}.value.`)
          return writable(found, fields, node)
        }
        fields.unshift(current.name.text)
        current = current.expression
      }
      const found = ctx.dialect.unwraps ? shared(current, ctx) : undefined
      return found && found.share.kind === 'state' ? writable(found, fields, node) : undefined
    },
    /** cart.add(item), or add(item): a function of a store, called. */
    call(node, ctx) {
      if (!ctx.component.stores) return undefined
      const found = shared(node.expression, ctx)
      if (!found) return undefined
      const { use, share } = found
      if (share.kind !== 'action') fail(node.expression, `${share.name} is not a function.`)
      const action = reader.stores.get(use.store).actions.find((each) => each.name === share.name)
      if (action.async && action.throws && !ctx.awaiting)
        fail(
          node,
          `${share.name} can fail, and nothing sees it when it is not awaited: write await inside try.`,
        )
      return {
        s: 'store',
        store: use.name,
        name: share.name,
        args: args(
          node,
          node.arguments,
          action.params.map((param) => param.type),
          ctx,
        ),
        ...(action.async ? { async: true } : {}),
        ...(action.throws ? { throws: true } : {}),
      }
    },
  }
  function writable(found, fields, node) {
    if (found.share.readonly)
      fail(node, `${found.share.name} is read-only outside its store: change it with a function.`)
    return { store: found.use.name, name: found.share.name, fields, type: tools.typeOf(node) }
  }
}
