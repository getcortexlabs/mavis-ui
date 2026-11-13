import { vueForms } from '../components/form.mjs'
// The Vue front end: Name.vue single-file components that already run on Vue Web and
// NativeScript-Vue, read for the Mac. <script setup lang="ts"> gives state (ref), derived values
// (computed), actions (functions), properties (defineProps, withDefaults) and events
// (defineEmits); the template gives the view. Vue's own compiler parses the file, vue-lower.mjs
// turns it into TypeScript, and the shared reader does the rest.
import ts from 'typescript'
import { contractImports } from '../contract-types.mjs'
import { composableValue } from './composables.mjs'
import { viewCondition } from './view-condition.mjs'
import { components as primitives, composables } from '../components/index.mjs'
import { PortableError, T } from '../model.mjs'
import { noteNavigator } from '../navigation/links.mjs'
import { navigateStatement } from '../navigation/routes.mjs'
import {
  declaredSlots,
  lower,
  macPlatform,
  mavisModules,
  vueEventListener,
  vueEventName,
  validVueEvent,
} from './vue-lower.mjs'
import { hooks, readEffect } from '../effects.mjs'

const ambientPath = 'shared/__mavis_vue__.d.ts'

export const vue = {
  name: 'Vue',
  extension: '.vue',
  direct: ['web', 'native'],
  prepare,
  open,
}

async function compilerSfc() {
  for (const name of ['vue/compiler-sfc', '@vue/compiler-sfc'])
    try {
      return await import(name)
    } catch (error) {
      if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error
    }
  throw new PortableError(
    'Reading shared .vue files needs the vue package: install vue in this project.',
  )
}

async function prepare(files) {
  const sfc = await compilerSfc()
  const sources = new Map()
  const origins = new Map()
  const problems = []
  // Every file's slot names first: a parent names the slots it fills.
  const slots = new Map([...files].map(([path, text]) => [path, declaredSlots(text, sfc)]))
  for (const [path, text] of files)
    try {
      const {
        file,
        text: lowered,
        plan,
        origin,
      } = lower(path, text, sfc, (other) => slots.get(other))
      sources.set(path, { file, text: lowered, plan })
      origins.set(file, origin)
    } catch (error) {
      if (!(error instanceof PortableError)) throw error
      problems.push(...error.diagnostics)
      // A file that could not be read still answers the imports of the others.
      sources.set(path, {
        file: `${path}.ts`,
        text: 'export default __mavisComponent<any, any, any>();\n',
        unread: true,
      })
    }
  return { sources, origins, problems, ambient: new Map([[ambientPath, ambient()]]) }
}

/** What a shared Vue file is checked against: the Vue and Mavis it may use, and the helpers
 * the lowered template calls. */
function ambient() {
  const names = Object.keys(primitives)
  // What a component declares for a script beside itself: globals, and the values and types a
  // file imports from Mavis (see source in components/index.mjs).
  const own = (part) =>
    Object.values(primitives)
      .flatMap((definition) => definition.vue?.source?.ambient?.[part] ?? [])
      .map((text) => (part === 'global' ? `${text}\n` : `\n  ${text}`))
      .join('')
  const platform = Object.entries(macPlatform)
    .map(([key, value]) =>
      typeof value === 'boolean'
        ? `readonly ${key}: boolean`
        : `readonly ${key}: 'web' | 'ios' | 'android' | 'macos'`,
    )
    .join('; ')
  // Types a component lists under vue.types are imported from Mavis by their own names.
  const listed = Object.values(primitives).flatMap((definition) => definition.vue?.types ?? [])
  const types = `export type InputHandle = __MavisInputHandle
  export type ChoiceValue = string
  export type ChoiceOption = SelectOption
  export type SegmentedOption = SelectOption
  export type SelectOption = __MavisSelectOption
  export type MasonryItem = __MavisMasonryItem
  export type RefreshContext = MavisRefreshContext
  export type VirtualListHandle = __MavisListHandle${listed.map((name) => `\n  export type ${name} = __MavisType${name}`).join('')}${own('types')}`
  return `${own('global').trimStart()}interface __MavisRef<T> { value: T; readonly __mavisRef: true }
${listed.map((name) => `type __MavisType${name} = ${name}\n`).join('')}interface __MavisInputHandle { focus(): void; blur(): void }
interface __MavisListHandle { scrollToIndex(index: number): void }
type __MavisSelectOption = SelectOption
type __MavisMasonryItem = MasonryItem
declare const __mavisElement: JSX.Element
type __MavisPlatform = { ${platform} }
declare module 'vue' {
  export interface Ref<T = any> extends __MavisRef<T> {}
  export interface ComputedRef<T = any> { readonly value: T; readonly __mavisRef: true }
  export function ref<T>(value: T): Ref<T>
  export function ref<T = undefined>(): Ref<T | undefined>
  export function computed<T>(getter: () => T): ComputedRef<T>
}
${mavisModules
  .map(
    (name) => `declare module '${name}' {
${names.map((component) => `  export const ${component}: unknown`).join('\n')}
  export function useMavisPlatform(): __MavisPlatform${own('values')}
  export function useMavisNavigation(): MavisNavigationApi
  export type MavisNavigation = MavisNavigationApi
  ${types}
${Object.values(composables)
  .flatMap((made) => [
    `  export ${made.declaration}`,
    ...Object.entries(made.exports ?? {}).map(([name, type]) => `  export type ${name} = ${type}`),
  ])
  .join('\n')}
}`,
  )
  .join('\n')}
declare module '@getcortexlabs/mavis-core' {
  ${types
    .split('\n')
    .filter(
      (line) =>
        ![...(contractImports().get('@getcortexlabs/mavis-core') ?? []), 'NavigationItem'].some(
          (name) => line.includes(`export type ${name} =`),
        ),
    )
    .join('\n')}
}
type __MavisBooleanKey<T, K extends keyof T = keyof T> = K extends unknown ? ([T[K]] extends [boolean | undefined] ? K : never) : never
type __MavisProps<T> = Readonly<Omit<T, __MavisBooleanKey<T>> & { [K in __MavisBooleanKey<T>]-?: boolean }>
type __MavisDefaulted<T, K> = Readonly<Omit<T, K & keyof T> & { [P in K & keyof T]-?: Exclude<T[P], undefined> }>
type __MavisEmit<E> = <K extends keyof E & string>(event: K, ...args: E[K] extends readonly unknown[] ? E[K] : never) => void
type __MavisListenerName<K extends string> = K extends \`update:\${infer P}\` ? \`onUpdate\${Capitalize<P>}\` : \`on\${Capitalize<K>}\`
type __MavisListeners<E> = { [K in keyof E & string as __MavisListenerName<K>]?: E[K] extends readonly unknown[] ? (...args: E[K]) => void : never }
declare const __mavisComponentProps: unique symbol
declare const __mavisComponentSlots: unique symbol
type __MavisComponent<P, S> = { readonly [__mavisComponentProps]: P; readonly [__mavisComponentSlots]: S }
type __MavisFills<S> = 0 extends 1 & S ? { [name: string]: (...args: any[]) => void } : { [K in keyof S]?: NonNullable<S[K]> extends (...args: infer A) => any ? (...args: A) => void : never }
declare function defineProps<T>(): __MavisProps<T>
declare function withDefaults<T, D extends { [K in keyof T]?: T[K] }>(props: T, defaults: D): __MavisDefaulted<T, keyof D>
declare function defineEmits<E>(): __MavisEmit<E>
declare function defineSlots<S>(): S
declare function __mavisComponent<P, E, S>(): __MavisComponent<P & __MavisListeners<E>, S>
type __MavisModelValue<C, K extends string> = C extends __MavisComponent<infer P, any> ? K extends keyof P ? P[K] : never : never
type __MavisListenerOf<C, K extends string> = C extends __MavisComponent<infer P, any> ? K extends keyof P ? NonNullable<P[K]> : never : never
declare function __mavisUse<P, S>(component: __MavisComponent<P, S>, props: NoInfer<P>, slots?: NoInfer<__MavisFills<S>>): void
declare function __mavisSlotProps(name: string, props: object): void
declare function __mavisUnwrap<T>(bindings: T): { [K in keyof T]: T[K] extends { readonly __mavisRef: true; readonly value: infer V } ? V : T[K] }
declare function __mavisEach<T>(list: readonly T[]): [T, number][]
declare function __mavisAbsent<T>(value: T): T extends null ? undefined : T
declare function __mavisFirst<A extends readonly unknown[]>(args: A): A extends readonly [infer F, ...unknown[]] ? F : undefined
declare function __mavisText(...parts: MavisText[]): string
declare function __mavisHandle<F>(handler: F): void
declare const __mavis: {
${names.map((name) => `  ${name}: ${primitives[name].vue?.source?.declaration ?? `typeof ${name}`}`).join('\n')}
}
`
}

function open(reader, file, path, source) {
  const { checker, fail, checkName, mapType, typeOf, scope, child, expr } = reader
  reader.lenient.add(file.fileName)
  const { script, scriptEnd, root } = source.plan
  const name = path.slice('shared/'.length, -'.vue'.length)
  const component = {
    name,
    path,
    imports: new Map(script.components),
    props: [],
    slots: [],
    state: [],
    getters: [],
    actions: [],
    view: null,
    refs: [],
  }
  const members = new Map()
  const signatures = new Map()
  const events = new Map()
  const flags = new Map()
  const pending = []
  const resources = []

  const declare = (node, memberName, kind) => {
    checkName(node, memberName, kind === 'Constant' ? 'State' : kind)
    if (members.has(memberName) || component.imports.has(memberName) || memberName === name)
      fail(node, `${memberName} is already declared in ${name}.`)
    members.set(memberName, kind)
  }
  const forms = vueForms({
    component,
    members,
    declare,
    pending,
    fail,
    expr,
    record: reader.record,
    ts,
  })
  const isCall = (node, callee) =>
    node &&
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === callee
  const kindOf = (node) => (ts.isIdentifier(node) ? members.get(node.text) : undefined)

  const value = (node, ctx, kind, memberName) => {
    if (ctx.mode === 'initializer' && kind !== 'Property' && kind !== 'Getter')
      fail(
        node,
        `An initial value cannot read ${memberName}: on the Mac nothing of the component exists yet. Read a property, or compute the value with computed.`,
      )
    if (kind === 'Getter') return { e: 'getter', name: memberName, type: reader.declaredType(node) }
    if (kind === 'Property') {
      const prop = component.props.find((item) => item.name === memberName)
      return { e: 'prop', name: memberName, type: prop.type }
    }
    return { e: 'state', name: memberName, type: reader.declaredType(node) }
  }
  const isValue = (kind) => ['State', 'Constant', 'Getter', 'Property'].includes(kind)
  const absent = (node) => fail(node, `${node.getText(file)} is not available here.`)

  // Members shared by the script and the template: props.name and the platform's answers.
  const owned = (node, ctx) => {
    const controller = composableValue(reader, node, ctx)
    if (controller) return controller
    const owner = node.expression
    const memberName = node.name.text
    if (node.questionDotToken || !ts.isIdentifier(owner) || ctx.locals.has(owner.text)) return
    const kind = members.get(owner.text)
    if (kind === 'Props') {
      const prop = component.props.find((item) => item.name === memberName)
      if (!prop || prop.type.k === 'function')
        fail(node, `${memberName} is not a property of ${name}.`)
      return { e: 'prop', name: memberName, type: prop.type }
    }
    if (kind === 'Platform' && memberName in macPlatform)
      return reader.constant(macPlatform[memberName])
  }
  // An action, an event or a field: what a call statement runs.
  const run = (node, ctx, unwrapped) => {
    const formEffect = forms.call(node, ctx)
    if (formEffect) return formEffect
    const callee = node.expression
    if (ts.isIdentifier(callee) && !ctx.locals.has(callee.text)) {
      const kind = members.get(callee.text)
      if (kind === 'Action')
        return {
          s: 'action',
          name: callee.text,
          args: reader.args(
            node,
            node.arguments,
            signatures.get(callee.text).map((param) => param.type),
            ctx,
          ),
        }
      if (kind === 'Emit' || (callee.text === '$emit' && unwrapped)) {
        const [event, ...rest] = node.arguments
        if (!event || !ts.isStringLiteral(event) || !events.has(event.text))
          fail(node, `${name} emits ${[...events.keys()].join(', ') || 'no events'}.`)
        const prop = component.props.find((item) => item.name === events.get(event.text))
        return {
          s: 'callback',
          name: prop.name,
          args: reader.args(node, rest, prop.type.params, ctx),
        }
      }
    }
    if (!ts.isPropertyAccessExpression(callee)) return
    // A handle of the Mavis API is called as it is: toast.show({ … }).
    const made = callee.expression
    if (kindOf(made) === 'Ref' && !ctx.locals.has(made.text)) {
      const reference = component.refs.find((ref) => ref.name === made.text)
      if (reference.owner)
        return primitives[reference.owner].composable.call({ node, ref: made.text, ctx, reader })
    }
    if (kindOf(callee.expression) === 'Navigation' && !ctx.locals.has(callee.expression.text))
      return navigateStatement(reader, node, ctx, T)
    // titleRef.value?.focus() in the script, titleRef?.focus() in the template.
    let field = callee.expression
    if (!unwrapped) {
      if (!ts.isPropertyAccessExpression(field) || field.name.text !== 'value') return
      field = field.expression
    }
    if (kindOf(field) !== 'Ref' || ctx.locals.has(field.text)) return
    if (component.refs.find((ref) => ref.name === field.text).kind === 'list')
      return reader.scrollToIndex(node, field.text, ctx)
    if (!['focus', 'blur'].includes(callee.name.text) || node.arguments.length)
      fail(callee, 'Field references support focus() and blur().')
    return { s: callee.name.text, ref: field.text }
  }
  const words = {
    nullish: true,
    truthy: true,
    constants: true,
    unknownEffect(node) {
      fail(
        node,
        'Call a function of this component, emit an event, or change an array with push, unshift or splice.',
      )
    },
    call(node, ctx) {
      const controller = composableValue(reader, node, ctx, true)
      if (controller) return controller
      const callee = node.expression
      if (
        ts.isPropertyAccessExpression(callee) &&
        kindOf(callee.expression) === 'Navigation' &&
        !ctx.locals.has(callee.expression.text)
      )
        fail(
          node,
          `${callee.getText(file)}(...) moves between screens; call it from an event handler or another function, not where a value is read.`,
        )
      if (!ts.isIdentifier(callee) || ctx.locals.has(callee.text)) return
      const kind = members.get(callee.text)
      if (kind === 'Action' || kind === 'Emit' || callee.text === '$emit')
        fail(
          node,
          `${callee.text}(...) changes things; call it from an event handler or another function, not where a value is read.`,
        )
    },
  }
  // In the script a ref and a computed are read through .value, and a constant by its name.
  const scriptDialect = {
    ...words,
    name(node, ctx) {
      const kind = members.get(node.text)
      if (kind === 'Flag') return reader.constant(macPlatform[flags.get(node.text)])
      if (kind === 'Constant') return value(node, ctx, kind, node.text)
      if (kind === 'State' || kind === 'Getter') fail(node, `Read ${node.text}.value.`)
      if (kind === 'Action')
        fail(node, `Call ${node.text}(...) from an event handler or another function.`)
      absent(node)
    },
    member(node, ctx) {
      const owner = node.expression
      if (
        node.name.text === 'value' &&
        !node.questionDotToken &&
        ts.isIdentifier(owner) &&
        !ctx.locals.has(owner.text) &&
        ['State', 'Getter'].includes(members.get(owner.text))
      )
        return value(node, ctx, members.get(owner.text), owner.text)
      return owned(node, ctx)
    },
    target(node, ctx) {
      const fields = []
      let current = node
      while (ts.isPropertyAccessExpression(current) && !current.questionDotToken) {
        const owner = current.expression
        if (
          current.name.text === 'value' &&
          kindOf(owner) === 'State' &&
          !ctx.locals.has(owner.text)
        )
          return { name: owner.text, fields, type: typeOf(node) }
        fields.unshift(current.name.text)
        current = current.expression
      }
      fail(node, 'Only a ref and the fields of its value can be changed: write name.value = ….')
    },
    effect: (node, ctx) => run(node, ctx, false),
  }
  // In the template Vue unwraps them: every member is read by its name.
  const templateDialect = {
    ...words,
    unwraps: true,
    name(node, ctx) {
      const kind = members.get(node.text)
      if (kind === 'Flag') return reader.constant(macPlatform[flags.get(node.text)])
      if (isValue(kind)) return value(node, ctx, kind, node.text)
      if (kind === 'Action')
        fail(
          node,
          `Call ${node.text}(...) from an event handler, for example @click="${node.text}".`,
        )
      absent(node)
    },
    member: owned,
    target(node, ctx) {
      const fields = []
      let current = node
      while (ts.isPropertyAccessExpression(current) && !current.questionDotToken) {
        fields.unshift(current.name.text)
        current = current.expression
      }
      if (kindOf(current) !== 'State' || ctx.locals.has(current.text))
        fail(node, 'Only a ref and the fields of its value can be changed.')
      return { name: current.text, fields, type: typeOf(node) }
    },
    effect: (node, ctx) => run(node, ctx, true),
  }
  const within = (mode) =>
    scope(component, members, mode, mode === 'view' ? templateDialect : scriptDialect)

  const statements = file.statements.filter((statement) => statement.getStart(file) < scriptEnd)
  const macros = []
  for (const statement of statements) {
    const calls = ts.isVariableStatement(statement)
      ? statement.declarationList.declarations.map((declaration) => declaration.initializer)
      : ts.isExpressionStatement(statement)
        ? [statement.expression]
        : []
    for (const call of calls) {
      if (isCall(call, 'withDefaults')) macros.push([call.arguments[0], call.arguments[1]])
      else if (isCall(call, 'defineProps') || isCall(call, 'defineEmits')) macros.push([call])
    }
  }
  for (const [call, defaults] of macros.filter(([call]) => isCall(call, 'defineProps')))
    properties(call, defaults)
  for (const [call] of macros.filter(([call]) => isCall(call, 'defineEmits'))) emitted(call)
  const effectCalls = []
  for (const statement of statements) {
    if (ts.isFunctionDeclaration(statement)) action(statement.name, statement)
    else if (ts.isVariableStatement(statement))
      statement.declarationList.declarations.forEach(variable)
    else if (
      ts.isExpressionStatement(statement) &&
      ts.isCallExpression(statement.expression) &&
      ts.isIdentifier(statement.expression.expression) &&
      statement.expression.expression.text in hooks
    )
      effectCalls.push(statement.expression)
  }
  for (const statement of statements) {
    const call = ts.isExpressionStatement(statement) ? statement.expression : null
    if (isCall(call, 'useFormField')) forms.field(call, within('pure'))
  }
  // watch(count, …): the ref or computed value itself is what changes.
  function watched(node, ctx) {
    const kind = ts.isIdentifier(node) ? members.get(node.text) : undefined
    if (kind !== 'State' && kind !== 'Getter') return undefined
    return {
      e: kind === 'Getter' ? 'getter' : 'state',
      name: node.text,
      type: mapType(
        checker.getTypeOfPropertyOfType(checker.getTypeAtLocation(node), 'value'),
        node,
      ),
    }
  }
  // The slots the template shows, in order, then those only defineSlots lists.
  const declared = []
  for (const statement of statements) {
    const call = ts.isExpressionStatement(statement) ? statement.expression : null
    if (!isCall(call, 'defineSlots')) continue
    const [typeNode] = call.typeArguments
    for (const property of checker.getPropertiesOfType(checker.getTypeFromTypeNode(typeNode))) {
      const at = property.valueDeclaration ?? property.declarations?.[0] ?? call
      const type = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(property, call))
      const signatures = type.getCallSignatures()
      if (signatures.length !== 1 || signatures[0].parameters.length > 1)
        fail(
          at,
          `Declare the slot ${property.name} as a function of what it hands its content: ${property.name}(props: { item: Task }): unknown.`,
        )
      const [param] = signatures[0].parameters
      declared.push({
        name: property.name,
        params: reader.slotParams(param && checker.getTypeOfSymbolAtLocation(param, call), at),
        node: at,
      })
    }
  }
  reader.declareSlots(component, [
    ...source.plan.slots.map((slot) => {
      const site = source.plan.sites.find((item) => item.name === slot)
      return {
        name: slot,
        params: declared.find((item) => item.name === slot)?.params ?? [],
        node: site ? nodeAt(site.at, ts.isCallExpression) : file,
      }
    }),
    ...declared,
  ])

  return {
    component,
    link(find) {
      for (const [importName, importPath] of component.imports)
        if (!find(importPath)) fail(file, `${importName} is not a shared component file.`)
    },
    finish(find) {
      for (const task of pending) task()
      for (const resource of resources) resource()
      reader.markFailing(component)
      for (const call of effectCalls) readEffect(reader, component, call, within, watched)
      const built = view(root, within('view'), find)
      if (built.length !== 1)
        fail(file, 'A shared screen has one root element; wrap the content in an MColumn.')
      component.view = built[0]
      for (const reference of component.refs) {
        if (!reference.field) {
          const unused = reference.owner
            ? primitives[reference.owner].composable.unused(reference.name, reference)
            : `${reference.name} is not attached to an ${reference.kind === 'list' ? 'MVirtualList' : 'MInput'} with ref="${reference.name}".`
          if (unused) fail(reference.node, unused)
        }
        delete reference.node
        delete reference.field
      }
      delete component.shortcuts
      delete component.async
      settle(component)
    },
  }

  function properties(call, defaults) {
    const [typeNode] = call.typeArguments
    for (const property of checker.getPropertiesOfType(checker.getTypeFromTypeNode(typeNode))) {
      const declaration = property.valueDeclaration ?? property.declarations?.[0]
      const at = declaration ?? call
      const optional = Boolean(property.flags & ts.SymbolFlags.Optional)
      const declared =
        declaration && ts.isPropertySignature(declaration) && declaration.type
          ? checker.getTypeFromTypeNode(declaration.type)
          : checker.getTypeOfSymbolAtLocation(property, call)
      if (declared.getCallSignatures().length)
        fail(
          at,
          `${property.name} is a function: a property holds data. Declare what ${name} reports with defineEmits.`,
        )
      const parts = declared.flags & ts.TypeFlags.Union ? declared.types : [declared]
      if (optional && parts.some((part) => part.flags & ts.TypeFlags.Null))
        fail(at, `${property.name} can be left out and can be null; use one for a missing value.`)
      declare(at, property.name, 'Property')
      let type = mapType(declared, at)
      const given = defaults?.properties.find((item) => item.name.text === property.name)
      const prop = { name: property.name, type }
      if (given) {
        const initial = given.initializer
        if (ts.isArrowFunction(initial) || ts.isFunctionExpression(initial))
          fail(initial, 'A default is a literal value: text, a number, true or false.')
        prop.default = expr(initial, within('initializer'), type)
        if (!['lit', 'undefined'].includes(prop.default.e))
          fail(initial, 'A default is a literal value: text, a number, true or false.')
      } else if (optional) {
        // Vue turns a missing boolean into false, and leaves anything else undefined.
        if (type.k === 'boolean') prop.default = { e: 'lit', value: false, type }
        else {
          if (type.k !== 'optional') prop.type = type = T.optional(type)
          prop.default = { e: 'undefined', type }
        }
      }
      component.props.push(prop)
    }
  }

  function emitted(call) {
    const [typeNode] = call.typeArguments
    for (const property of checker.getPropertiesOfType(checker.getTypeFromTypeNode(typeNode))) {
      const at = property.valueDeclaration ?? property.declarations?.[0] ?? call
      const event = property.name
      if (!validVueEvent(event))
        fail(at, `Name the event ${event} in camelCase, for example saveDraft.`)
      const payload = checker.getTypeOfSymbolAtLocation(property, call)
      if (
        !checker.isTupleType(payload) ||
        payload.target.elementFlags.some((flag) => !(flag & ts.ElementFlags.Required))
      )
        fail(at, 'Declare the arguments of an event as a list: saved: [id: string].')
      const listener = vueEventListener(event)
      declare(at, listener, 'Callback')
      events.set(event, listener)
      component.props.push({
        name: listener,
        type: T.fn(checker.getTypeArguments(payload).map((item) => mapType(item, at))),
      })
    }
  }

  function action(nameNode, fn) {
    const actionName = nameNode.text
    declare(nameNode, actionName, 'Action')
    const waits = Boolean(fn.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword))
    const returned = checker.getReturnTypeOfSignature(checker.getSignatureFromDeclaration(fn))
    const result = waits ? (checker.getAwaitedType(returned) ?? returned) : returned
    if (waits) (component.async ??= new Set()).add(actionName)
    if (!(result.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined)))
      fail(
        nameNode,
        `${actionName} returns a value. A function changes state and returns nothing: write its body in braces, and compute values with computed.`,
      )
    const params = fn.parameters.map((parameter) => {
      if (
        !ts.isIdentifier(parameter.name) ||
        parameter.initializer ||
        parameter.questionToken ||
        parameter.dotDotDotToken
      )
        fail(parameter, 'Function parameters are simple typed names.')
      if (!parameter.type) fail(parameter, 'Give each function parameter a type.')
      checkName(parameter, parameter.name.text, 'Parameter')
      return { name: parameter.name.text, type: typeOf(parameter) }
    })
    signatures.set(actionName, params)
    pending.push(() => {
      const ctx = { ...within('action'), failing: true, async: waits }
      params.forEach((param) => ctx.locals.set(param.name, param.type))
      component.actions.push({
        name: actionName,
        params,
        body: reader.block(fn.body, ctx),
        ...(waits ? { async: true } : {}),
      })
    })
  }

  function variable(declaration) {
    const { initializer } = declaration
    if (reader.storeBind(component, declaration, declare)) return
    if (ts.isObjectBindingPattern(declaration.name)) {
      for (const element of declaration.name.elements) {
        members.set(element.name.text, 'Flag')
        flags.set(element.name.text, (element.propertyName ?? element.name).getText(file))
      }
      return
    }
    const memberName = declaration.name.text
    const kind = script.bindings.get(memberName)
    if (kind === 'props' || kind === 'emit' || kind === 'platform')
      return members.set(memberName, { props: 'Props', emit: 'Emit', platform: 'Platform' }[kind])
    if (kind === 'navigation') {
      noteNavigator(component, declaration)
      return members.set(memberName, 'Navigation')
    }
    if (kind === 'form') return forms.make(declaration)
    if (kind === 'function') return action(declaration.name, initializer)
    if (composables[kind]) {
      const made = composables[kind]
      declare(declaration, memberName, 'Ref')
      const reference = {
        name: memberName,
        node: declaration,
        kind: made.kind,
        owner: made.owner,
      }
      component.refs.push(reference)
      resources.push(() => {
        const options = made.open({ call: initializer, fail, ts, reader, within })
        if (options) reference.options = options
      })
      return
    }
    if (kind === 'const') {
      declare(declaration, memberName, 'Constant')
      return pending.push(() => {
        const type = typeOf(declaration.name)
        component.state.push({
          name: memberName,
          type,
          init: expr(initializer, within('initializer'), type),
        })
      })
    }
    const held = checker.getTypeOfPropertyOfType(
      checker.getTypeAtLocation(declaration.name),
      'value',
    )
    if (kind === 'ref') {
      const parts = held.flags & ts.TypeFlags.Union ? held.types : [held]
      const handle = ['__MavisInputHandle', '__MavisListHandle'].find((symbol) =>
        parts.some((part) => part.getSymbol()?.name === symbol),
      )
      if (handle) {
        declare(declaration, memberName, 'Ref')
        return component.refs.push({
          name: memberName,
          node: declaration,
          ...(handle === '__MavisListHandle' ? { kind: 'list' } : {}),
        })
      }
      declare(declaration, memberName, 'State')
      return pending.push(() => {
        const type = mapType(held, declaration.name)
        const [initial] = initializer.arguments
        if (initializer.arguments.length > 1) fail(initializer, 'ref takes one initial value.')
        if (!initial && type.k !== 'optional') fail(initializer, 'Give ref an initial value.')
        component.state.push({
          name: memberName,
          type,
          init: initial
            ? reader.own(expr(initial, within('initializer'), type), initial)
            : { e: 'undefined', type },
        })
      })
    }
    declare(declaration, memberName, 'Getter')
    pending.push(() => {
      const [getter] = initializer.arguments
      if (
        initializer.arguments.length !== 1 ||
        !ts.isArrowFunction(getter) ||
        getter.parameters.length
      )
        fail(
          initializer,
          'computed takes a function that returns the value: computed(() => first + second).',
        )
      const type = mapType(held, declaration.name)
      const ctx = within('pure')
      const locals = []
      let result = getter.body
      if (ts.isBlock(getter.body)) {
        const list = getter.body.statements
        list.slice(0, -1).forEach((statement) => locals.push(reader.local(statement, ctx)))
        const last = list.at(-1)
        if (!last || !ts.isReturnStatement(last) || !last.expression)
          fail(
            getter,
            'A computed value is optional const declarations followed by return <expression>.',
          )
        result = last.expression
      }
      component.getters.push({ name: memberName, type, locals, expr: expr(result, ctx, type) })
    })
  }

  /** The outermost node the lowered template wrote at this offset. */
  function nodeAt(at, test) {
    let found
    const visit = (node) => {
      if (found || at < node.getFullStart() || at >= node.getEnd()) return
      if (node.getStart(file) === at && test(node)) found = node
      else ts.forEachChild(node, visit)
    }
    visit(file)
    return found
  }
  function written({ at }) {
    return unwrap(nodeAt(at, ts.isParenthesizedExpression))
  }
  function unwrap(node) {
    while (ts.isParenthesizedExpression(node)) node = node.expression
    return isCall(node, '__mavisAbsent') ? unwrap(node.arguments[0]) : node
  }

  // A name for a handler's argument that no v-for item around it already has.
  function free(wanted, ctx) {
    let candidate = wanted
    while (ctx.locals.has(candidate))
      candidate = `next${candidate.charAt(0).toUpperCase()}${candidate.slice(1)}`
    return candidate
  }

  // What Vue makes of a listener: see listener() in vue-lower.mjs.
  function listener(heard, params, ctx) {
    if (heard.kind === 'arrow') return reader.handler(written(heard), params, ctx)
    if (heard.kind === 'method') {
      const called = written(heard)
      if (kindOf(called) !== 'Action')
        fail(
          called,
          `${called.text} is not a function of ${name}; write the handler as an arrow function.`,
        )
      const taken = signatures.get(called.text)
      if (taken.length > params.length)
        fail(
          called,
          `${called.text} takes ${taken.length} argument(s); this event passes ${params.length}.`,
        )
      taken.forEach((param, index) => reader.expect(called, params[index], param.type))
      return {
        params: params.map((type, index) =>
          index < taken.length
            ? { name: taken[index].name, type }
            : { name: '_', type, unused: true },
        ),
        body: [
          {
            s: 'action',
            name: called.text,
            args: taken.map((param, index) => ({
              e: 'local',
              name: param.name,
              type: params[index],
            })),
          },
        ],
      }
    }
    if (heard.kind === 'model') {
      if (params.length !== 1)
        fail(written(heard.target), 'A model update event passes exactly one value.')
      const node = written(heard.target)
      const [type] = params
      const target =
        reader.storeTarget(node, child(ctx, 'action')) ??
        templateDialect.target(node, child(ctx, 'action'))
      reader.expect(node, type, target.type)
      const also = heard.also && listener(heard.also, params, ctx)
      const named = also?.params[0]?.unused === undefined ? also?.params[0]?.name : undefined
      const local = named ?? free('value', ctx)
      return {
        params: [{ name: local, type }],
        body: [
          { s: 'assign', target, op: '=', value: { e: 'local', name: local, type } },
          ...(also?.body ?? []),
        ],
      }
    }
    const inline = nodeAt(heard.at, ts.isArrowFunction)
    const inner = child(ctx, 'action')
    const event = free('event', ctx)
    if (heard.usesEvent) {
      if (!params.length) fail(inline, 'This event passes no value, so there is no $event.')
      inner.locals.set('$event', params[0])
      inner.renamed = new Map([['$event', event]])
    }
    const generated = (statement) =>
      ts.isVariableStatement(statement) &&
      statement.declarationList.declarations[0].name.getText(file) === '$event'
    return {
      params: params.map((type, index) =>
        index === 0 && heard.usesEvent ? { name: event, type } : { name: '_', type, unused: true },
      ),
      body: inline.body.statements
        .filter((statement) => !generated(statement))
        .flatMap((statement) => reader.statement(statement, inner)),
    }
  }

  function view(plan, ctx, find) {
    const all = (plans, inner) => plans.flatMap((item) => view(item, inner, find))
    if (plan.kind === 'if') {
      const [first, ...rest] = plan.branches
      const otherwiseContext = { ...ctx, inShow: true }
      const { when, binding, inner } = viewCondition(reader, written(first.when), ctx, T.boolean)
      const then = all(first.children, inner)
      const otherwise = !rest.length
        ? []
        : rest[0].when
          ? view({ kind: 'if', branches: rest }, otherwiseContext, find)
          : all(rest[0].children, otherwiseContext)
      if (when.e === 'lit' && when.fixed) return when.value ? then : otherwise
      return [{ v: 'show', when, then, else: otherwise, ...(binding ? { binding } : {}) }]
    }
    if (plan.kind === 'for') {
      const listNode = written(plan.list)
      const each = expr(listNode, ctx)
      if (each.type.k !== 'array') fail(listNode, 'v-for needs an array.')
      const inner = child(ctx)
      for (const alias of [plan.item, plan.index].filter(Boolean))
        checkName(listNode, alias, 'Parameter')
      inner.locals.set(plan.item, each.type.of)
      if (plan.index) inner.locals.set(plan.index, T.number)
      const key = reader.listKey(written(plan.key), plan.item, each, `:key="${plan.item}.id"`)
      inner.keyed = true
      inner.inFor = true
      const body = view(plan.body, inner, find)
      if (body.length !== 1) fail(listNode, 'v-for repeats one element.')
      return [{ v: 'for', each, item: plan.item, index: plan.index, key, body: body[0] }]
    }
    const call = nodeAt(plan.at, ts.isCallExpression)
    if (plan.kind === 'slot') {
      const given = new Map(
        call.arguments[1].properties.map((property) => [
          property.name.text,
          unwrap(property.initializer),
        ]),
      )
      const fallback = all(plan.fallback, { ...ctx, inShow: true })
      return [reader.slotSite(component, plan.name, given, fallback, call, ctx)]
    }
    const keyed = ctx.keyed
    ctx = { ...ctx, keyed: false }
    const entries = new Map()
    const attrs = new Map()
    for (const entry of plan.attrs) {
      const node = nodeAt(entry.at, ts.isPropertyAssignment)
      entries.set(node, entry)
      attrs.set(entry.key, node)
    }
    if (plan.kind === 'component') {
      const target = find(script.components.get(plan.name)).component
      reader.useComponent(target, component, call)
      const eventOf = vueEventName
      const props = []
      for (const prop of target.props) {
        const node = attrs.get(prop.name)
        const entry = entries.get(node)
        if (prop.type.k === 'function') {
          if (node && !entry.handler)
            fail(
              node,
              `${prop.name} is an event of ${plan.name}; listen with @${eventOf(prop.name)}.`,
            )
          // Nobody listens: the event has nowhere to go.
          const handler = node
            ? listener(entry.handler, prop.type.params, ctx)
            : {
                params: prop.type.params.map((type) => ({ name: '_', type, unused: true })),
                body: [],
              }
          reader.cannotFail(
            handler,
            component,
            node ?? call,
            `${eventOf(prop.name)} of ${plan.name}`,
          )
          props.push({ name: prop.name, value: { handler } })
          continue
        }
        if (!node) {
          if (!('default' in prop)) fail(call, `${plan.name} needs ${prop.name}.`)
          continue
        }
        if (entry.handler) fail(node, `${plan.name} does not emit ${eventOf(prop.name)}.`)
        props.push({
          name: prop.name,
          value: {
            expr: entry.valueless
              ? (reader.expect(node, T.boolean, prop.type),
                { e: 'lit', value: true, type: T.boolean })
              : expr(unwrap(node.initializer), ctx, prop.type),
          },
        })
      }
      for (const [key, node] of attrs)
        if (!target.props.some((prop) => prop.name === key))
          fail(
            node,
            entries.get(node).handler
              ? `${plan.name} does not emit ${eventOf(key)}.`
              : `${plan.name} has no property ${key}.`,
          )
      const order = target.slots.map((slot) => slot.name)
      const fills = plan.slots
        .map((fill) => {
          const assignment = nodeAt(fill.at, ts.isPropertyAssignment)
          return reader.slotContent(
            target,
            fill.name,
            assignment.initializer.parameters[0],
            assignment,
            ctx,
            (inner) => all(fill.children, inner),
          )
        })
        .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))
      return [{ v: 'component', name: plan.name, props, slots: fills, keyed }]
    }
    const spec = primitives[plan.name]
    if (spec.screen) reader.placeScreen(plan.name, ctx, call)
    if (plan.ref) {
      const node = nodeAt(plan.ref.at, ts.isParenthesizedExpression)
      entries.set(node, { ref: true })
      attrs.set('ref', node)
    }
    const props = reader.properties(plan.name, attrs, call, ctx, {
      value(node) {
        const entry = entries.get(node)
        if (entry.ref) return node.expression
        return entry.valueless ? undefined : unwrap(node.initializer)
      },
      isLiteral(node) {
        const entry = entries.get(node)
        if (entry.valueless) return true
        const given = unwrap(node.initializer)
        return (
          ts.isStringLiteral(given) ||
          given.kind === ts.SyntaxKind.TrueKeyword ||
          given.kind === ts.SyntaxKind.FalseKeyword
        )
      },
      read(key, node, kind) {
        const entry = entries.get(node)
        if (entry.handler)
          return listener(
            entry.handler,
            kind.event?.({
              T,
              record: reader.record,
              type: (name) =>
                attrs.has(name) && !entries.get(attrs.get(name)).handler
                  ? reader.typeOf(unwrap(attrs.get(name).initializer))
                  : undefined,
            }) ?? reader.handlerParams[kind],
            ctx,
          )
        if (entry.parts) return content(entry.parts, ctx)
      },
    })
    if (spec.children === 'text') {
      const parts = joined(plan.text, ctx)
      if (!parts.length) fail(call, 'MText needs text.')
      return [{ v: 'text', tag: plan.name, props, parts, keyed }]
    }
    const parent = { tag: plan.name, gap: props.gap }
    const element = {
      v: 'element',
      tag: plan.name,
      props,
      children: all(plan.children, { ...ctx, parent }),
      keyed,
    }
    if (plan.slots)
      element.slots = [...plan.slots]
        .sort((a, b) => spec.slots.indexOf(a.name) - spec.slots.indexOf(b.name))
        .map((fill) => {
          if (!fill.scoped)
            return {
              name: fill.name,
              params: [],
              body: all(fill.children, { ...ctx, parent: { tag: plan.name } }),
            }
          const assignment = nodeAt(fill.at, ts.isPropertyAssignment)
          return reader.elementSlot(
            plan.name,
            fill.name,
            spec.scoped[fill.name](props, { record: reader.record, fields: reader.fields, T }),
            assignment.initializer.parameters[0],
            assignment,
            ctx,
            (inner) => all(fill.children, inner),
          )
        })
    spec.checkChildren?.({
      tag: call,
      element,
      fail,
      hasControl: reader.hasControl,
      reader,
      ctx,
    })
    return [element]
  }

  function joined(parts, ctx) {
    const out = []
    for (const part of parts) {
      if (typeof part === 'string') {
        if (part) out.push(part)
        continue
      }
      if (part.span) {
        out.push(inlineRun(part.span, ctx))
        continue
      }
      const node = written(part)
      reader.shown(out, expr(node, ctx), node)
    }
    return reader.joinText(out)
  }

  // An MSpan run: its properties, read like a primitive's, and its own text.
  function inlineRun(entry, ctx) {
    const call = nodeAt(entry.at, ts.isCallExpression)
    const name = call.expression.name.text
    const entries = new Map()
    const attrs = new Map()
    for (const attribute of entry.attrs) {
      const node = nodeAt(attribute.at, ts.isPropertyAssignment)
      entries.set(node, attribute)
      attrs.set(attribute.key, node)
    }
    const props = reader.properties(name, attrs, call, ctx, {
      value: (node) => (entries.get(node).valueless ? undefined : unwrap(node.initializer)),
      isLiteral(node) {
        if (entries.get(node).valueless) return true
        const given = unwrap(node.initializer)
        return (
          ts.isStringLiteral(given) ||
          given.kind === ts.SyntaxKind.TrueKeyword ||
          given.kind === ts.SyntaxKind.FalseKeyword
        )
      },
    })
    const parts = joined(entry.text, ctx)
    if (!parts.length) fail(call, `${name} needs text.`)
    return { v: 'span', props, parts }
  }

  // The content of a button as its text: a literal when nothing in it changes.
  function content(parts, ctx) {
    const out = joined(parts, ctx)
    if (out.every((part) => typeof part === 'string')) return { lit: out.join('') }
    if (out.length === 1 && out[0].type.k === 'string') return { expr: out[0] }
    return { expr: { e: 'template', parts: out, type: T.string } }
  }
}

// What was decided while generating leaves no trace in the model.
function settle(value) {
  if (!value || typeof value !== 'object') return
  if (value instanceof Map) return value.forEach(settle)
  if (!Array.isArray(value)) delete value.fixed
  Object.values(value).forEach(settle)
}
