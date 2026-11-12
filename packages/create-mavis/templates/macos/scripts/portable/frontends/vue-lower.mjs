// Lowers one Vue single-file component to TypeScript the checker can read, and to a plan of
// its template that says where each expression went. The script keeps its own positions; the
// template becomes calls on the Mavis declarations, so its properties and handlers are typed
// like the script. Everything outside the supported subset fails here, named in Vue's terms,
// with its position in the .vue file.
import ts from 'typescript'
import { components as primitives } from '../components/index.mjs'
import { builtInThemes, themeImport } from '../components/theme.mjs'
import { failure } from '../model.mjs'

/** What useMavisPlatform() answers in the generated Mac app. */
export const macPlatform = Object.freeze({
  platform: 'macos',
  isWeb: false,
  isNative: false,
  isIOS: false,
  isAndroid: false,
  isMacOS: true,
})

/** Modules a shared file imports Mavis from; each host resolves them to its renderer. */
export const mavisModules = [
  '#mavis',
  '@getcortexlabs/mavis-core/vue',
  '@getcortexlabs/mavis-web',
  '@getcortexlabs/mavis/vue',
]
const mavisTypes = [
  'InputHandle',
  'ChoiceOption',
  'ChoiceValue',
  'SelectOption',
  'MasonryItem',
  'VirtualListHandle',
  'IconName',
  'IconSize',
  'SegmentedOption',
  ...Object.values(primitives).flatMap((definition) => definition.vue?.types ?? []),
  'TabOption',
  'StepOption',
]
const mavisValues = [...Object.keys(primitives), 'MReveal', 'useMavisPlatform']
const handlerKinds = [
  'handler',
  'string-handler',
  'key',
  'boolean-handler',
  'number-handler',
  'optional-number-handler',
  'numbers-handler',
  ...Object.values(primitives).flatMap((definition) => Object.keys(definition.handlers ?? {})),
]
// What the listener beside a v-model receives, by the kind of the event.
const handlerValues = {
  'boolean-handler': 'boolean',
  'number-handler': 'number',
  'optional-number-handler': 'number | null',
  'numbers-handler': '[number, number]',
}

const browserGlobals = new Set(
  'window document localStorage sessionStorage navigator location history HTMLElement Element Node Event KeyboardEvent MouseEvent ResizeObserver MutationObserver IntersectionObserver getComputedStyle matchMedia requestAnimationFrame cancelAnimationFrame fetch alert confirm'.split(
    ' ',
  ),
)
const nativeViews = new Set(
  'Frame Page ActionBar ActionItem NavigationButton StackLayout GridLayout FlexboxLayout WrapLayout DockLayout AbsoluteLayout RootLayout ScrollView ContentView Label Button TextField TextView Image ListView Switch Slider Progress ActivityIndicator DatePicker TimePicker ListPicker SearchBar SegmentedBar TabView WebView HtmlView Span FormattedString'.split(
    ' ',
  ),
)
const vueImports = {
  watch: 'effects are not part of the portable model yet',
  watchEffect: 'effects are not part of the portable model yet',
  onMounted: 'lifecycle hooks are not part of the portable model yet',
  onUnmounted: 'lifecycle hooks are not part of the portable model yet',
  onBeforeUnmount: 'lifecycle hooks are not part of the portable model yet',
  reactive: 'declare each value with ref',
  useSlots:
    'a component cannot ask which slots it was given on the Mac yet; give the slot fallback content instead',
  nextTick: 'the Mac has no render queue to wait for',
}

const pascal = (tag) =>
  tag
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
const camel = (name) => name.replace(/-(\w)/g, (_, letter) => letter.toUpperCase())
const supported = `shared screens use ${Object.keys(primitives).join(', ')} and MReveal`

/** How a Vue file writes a primitive: its attributes and events by the model property they set. */
function spelling(name) {
  const spec = primitives[name]
  const hidden = spec.vue?.source?.hidden ?? []
  const attributes = new Map()
  const events = new Map()
  for (const [key, kind] of Object.entries(spec.props)) {
    if (hidden.includes(key)) continue
    const renamed = spec.vue?.rename?.[key]
    if (handlerKinds.includes(kind) || kind.event)
      events.set(renamed ?? key.charAt(2).toLowerCase() + key.slice(3), key)
    else attributes.set(renamed ?? key, key)
  }
  return { spec, attributes, events, source: spec.vue?.source ?? {} }
}

// The slot names a component declares: what its template shows and what defineSlots lists,
// and which of them hand their content properties. Read before any file is lowered, so a
// parent can name what it fills. Undefined when the file does not parse.
export function declaredSlots(source, sfc) {
  const { descriptor, errors } = sfc.parse(source)
  if (errors.length) return undefined
  const names = []
  const scoped = new Set()
  const add = (name, props) => {
    if (!names.includes(name)) names.push(name)
    if (props) scoped.add(name)
  }
  const visit = (node) => {
    if (node.type === 1 && node.tag === 'slot') {
      const named = node.props.find((prop) => prop.type === 6 && prop.name === 'name')
      add(
        named ? (named.value?.content ?? '') : 'default',
        node.props.some((prop) =>
          prop.type === 6
            ? prop.name !== 'name'
            : prop.name === 'bind' && !['name', 'key'].includes(prop.arg?.content),
        ),
      )
    }
    node.children?.forEach(visit)
  }
  if (descriptor.template?.ast) visit(descriptor.template.ast)
  const content = descriptor.scriptSetup?.content
  if (content) {
    const file = ts.createSourceFile('slots.ts', content, ts.ScriptTarget.Latest, true)
    for (const statement of file.statements) {
      const call = ts.isExpressionStatement(statement) ? statement.expression : null
      if (!call || !ts.isCallExpression(call) || call.expression.getText(file) !== 'defineSlots')
        continue
      for (const member of slotMembers(call.typeArguments?.[0], file) ?? []) {
        const parameters = ts.isMethodSignature(member)
          ? member.parameters
          : member.type && ts.isFunctionTypeNode(member.type)
            ? member.type.parameters
            : []
        add(member.name.getText(file), parameters.length > 0)
      }
    }
  }
  return { names, scoped }
}

// The members of a slots type written in the file: a literal, or a local interface or alias.
function slotMembers(type, file) {
  if (!type) return undefined
  if (ts.isTypeLiteralNode(type)) return type.members
  if (!ts.isTypeReferenceNode(type) || !ts.isIdentifier(type.typeName)) return undefined
  const local = file.statements.find(
    (statement) =>
      (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) &&
      statement.name.text === type.typeName.text,
  )
  if (!local) return undefined
  if (ts.isInterfaceDeclaration(local)) return local.members
  return ts.isTypeLiteralNode(local.type) ? local.type.members : undefined
}

export function lower(path, source, sfc, slotsOf = () => undefined) {
  const lines = [0]
  for (let index = 0; index < source.length; index++)
    if (source[index] === '\n') lines.push(index + 1)
  const position = (offset) => {
    let low = 0
    let high = lines.length - 1
    while (low < high) {
      const middle = (low + high + 1) >> 1
      if (lines[middle] <= offset) low = middle
      else high = middle - 1
    }
    return { line: low + 1, column: offset - lines[low] + 1 }
  }
  const problem = (offset, message) => {
    throw failure([{ file: path, ...position(offset), message }])
  }
  const unsupported = (offset, construct, reason = '') =>
    problem(
      offset,
      `${construct} is not supported in shared screens for the Mac${reason ? `: ${reason}` : ''}.`,
    )

  const { descriptor, errors } = sfc.parse(source, { filename: path })
  for (const error of errors) problem(error.loc?.start.offset ?? 0, String(error.message ?? error))
  // A block's own position is its content; its tag opens before that.
  const opening = (block) =>
    Math.max(0, source.lastIndexOf(`<${block.type}`, block.loc.start.offset))
  if (descriptor.script) unsupported(opening(descriptor.script), 'A <script> block without setup')
  const setup = descriptor.scriptSetup
  if (setup?.src) unsupported(opening(setup), '<script src>')
  if (setup && setup.lang !== 'ts')
    problem(opening(setup), 'Shared screens for the Mac use <script setup lang="ts">.')
  for (const style of descriptor.styles)
    unsupported(
      opening(style),
      '<style>',
      'CSS does not reach the Mac; use the layout, spacing and typography properties',
    )
  for (const block of descriptor.customBlocks) unsupported(opening(block), `<${block.type}>`)
  const template = descriptor.template
  if (!template) problem(0, 'A shared screen needs a <template>.')
  if (template.src) unsupported(opening(template), '<template src>')
  if (template.lang && template.lang !== 'html')
    unsupported(opening(template), `<template lang="${template.lang}">`)

  // The script at its own offsets, so its positions are the .vue file's.
  const scriptEnd = setup ? setup.loc.end.offset : 0
  const scriptText = setup
    ? source.slice(0, setup.loc.start.offset).replace(/[^\r\n]/g, ' ') + setup.content
    : ''
  const script = readScript(
    ts.createSourceFile('script.ts', scriptText, ts.ScriptTarget.Latest, true),
  )

  // Names the template declares itself: v-for items, which may shadow anything.
  const aliases = []
  // Generated text and where each stretch of it comes from in the .vue file.
  let text = scriptText
  const marks = [{ at: 0, source: 0, exact: true }]
  const glue = (code, anchor, echo = false) => {
    if (anchor !== undefined) marks.push({ at: text.length, source: anchor, exact: false, echo })
    text += code
  }
  const copy = (start, end) => {
    const at = text.length
    marks.push({ at, source: start, exact: true })
    text += source.slice(start, end)
    marks.push({ at: text.length, source: end, exact: false })
    return at
  }
  /** A source expression in parentheses; the offset finds its node again after checking. */
  const expression = (start, end) => {
    domScan(start, end)
    const at = text.length
    glue('(', start)
    copy(start, end)
    glue(')')
    return { at }
  }
  const echo = (span) => {
    glue(source.slice(span.start, span.end), span.start, true)
    marks.push({ at: text.length, source: span.end, exact: false })
  }

  // Names the template shows, in order; the slots this component's parents can fill.
  const shownSlots = []
  if (script.props) {
    glue('declare const __mavisProps: __MavisDefaulted<__MavisProps<', scriptEnd)
    echo(script.props.type)
    glue(
      `>, ${script.props.defaults.map((name) => JSON.stringify(name)).join(' | ') || 'never'}>;\n`,
      scriptEnd,
    )
  }
  if (script.emits) {
    glue('declare const __mavisEmit: __MavisEmit<', scriptEnd)
    echo(script.emits.type)
    glue('>;\n', scriptEnd)
  }
  const visible = [...script.bindings.keys()]
  for (const name of script.props?.names ?? [])
    if (script.bindings.has(name) || script.shared.has(name))
      problem(
        script.props.type.start,
        `${name} is both a property and a name in the script; the template could mean either. Rename one.`,
      )
  glue(`const __mavisScope = __mavisUnwrap({ ${visible.join(', ')} });\n`, scriptEnd)
  glue('function __mavisRender() {\n', template.loc.start.offset)
  if (script.props?.names.length) glue(`let { ${script.props.names.join(', ')} } = __mavisProps;\n`)
  if (visible.length) glue(`let { ${visible.join(', ')} } = __mavisScope;\n`)
  if (script.emits) glue('let $emit = __mavisEmit;\n')
  const roots = children(template.ast.children)
  glue('}\n', template.loc.end.offset)
  const slotNames = [
    ...new Set([
      ...shownSlots.map((slot) => slot.name),
      ...(slotsOf(path)?.names ?? []),
      ...(script.slots?.names ?? []),
    ]),
  ]
  glue('\n;export default __mavisComponent<', scriptEnd)
  if (script.props) echo(script.props.type)
  else glue('{}')
  glue(', ')
  if (script.emits) echo(script.emits.type)
  else glue('{}')
  glue(', ')
  if (script.slots) echo(script.slots.type)
  else glue(`{ ${slotNames.map((name) => `${name}?: () => unknown`).join('; ')} }`)
  glue('>();\n', scriptEnd)
  if (roots.length !== 1)
    problem(
      opening(template),
      'A shared screen has one root element; wrap the content in an MColumn.',
    )

  return {
    file: `${path}.ts`,
    text,
    plan: { root: roots[0], script, scriptEnd, slots: slotNames, sites: shownSlots },
    origin: {
      path,
      at(offset) {
        let low = 0
        let high = marks.length - 1
        while (low < high) {
          const middle = (low + high + 1) >> 1
          if (marks[middle].at <= offset) low = middle
          else high = middle - 1
        }
        const mark = marks[low]
        return {
          ...position(mark.exact ? mark.source + offset - mark.at : mark.source),
          ...(mark.echo ? { echo: true } : {}),
        }
      },
    },
  }

  function readScript(file) {
    const found = {
      props: null,
      emits: null,
      slots: null,
      bindings: new Map(),
      shared: new Set(),
      components: new Map(),
      platform: { object: null, flags: new Map() },
    }
    const at = (node) => node.getStart(file)
    const typeNames = new Map()
    for (const statement of file.statements)
      if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement))
        typeNames.set(statement.name.text, statement)

    function propertyNames(type) {
      const literal = ts.isTypeLiteralNode(type)
        ? type
        : ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName) && !type.typeArguments
          ? typeNames.get(type.typeName.text)
          : null
      const members = !literal
        ? null
        : ts.isTypeLiteralNode(literal) || ts.isInterfaceDeclaration(literal)
          ? literal.members
          : ts.isTypeLiteralNode(literal.type)
            ? literal.type.members
            : null
      if (!members)
        problem(
          at(type),
          'Declare the properties in this file, for example defineProps<{ title: string }>().',
        )
      return members.map((member) => {
        if (!ts.isPropertySignature(member) || !ts.isIdentifier(member.name))
          problem(at(member), 'Properties and events are declared as name: type.')
        return member.name.text
      })
    }

    function macro(call, binding) {
      const name = ts.isIdentifier(call.expression) ? call.expression.text : ''
      if (name === 'withDefaults') {
        const [inner, defaults] = call.arguments
        if (
          call.arguments.length !== 2 ||
          !ts.isCallExpression(inner) ||
          !ts.isIdentifier(inner.expression) ||
          inner.expression.text !== 'defineProps' ||
          !ts.isObjectLiteralExpression(defaults)
        )
          problem(at(call), 'Write withDefaults(defineProps<{ ... }>(), { name: value }).')
        macro(inner, binding)
        found.props.defaults = defaults.properties.map((property) => {
          if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name))
            problem(at(property), 'Defaults are written as name: value.')
          return property.name.text
        })
        return true
      }
      if (name === 'defineSlots') {
        const [type] = call.typeArguments ?? []
        if (!type || call.typeArguments.length !== 1 || call.arguments.length)
          problem(
            at(call),
            'Declare slots with what they hand their content: defineSlots<{ row(props: { item: Task }): unknown }>().',
          )
        if (binding)
          problem(
            at(call),
            'Call defineSlots<{ … }>() on its own: a component cannot ask which slots it was given on the Mac yet.',
          )
        if (found.slots) problem(at(call), 'defineSlots is called once.')
        const members = slotMembers(type, file)
        if (!members)
          problem(
            at(type),
            'Declare the slots in this file, for example defineSlots<{ header(): unknown }>().',
          )
        found.slots = {
          type: { start: at(type), end: type.getEnd() },
          names: members.map((member) => {
            if (
              !(ts.isMethodSignature(member) || ts.isPropertySignature(member)) ||
              !ts.isIdentifier(member.name)
            )
              problem(at(member), 'Declare each slot by name: header(): unknown.')
            return member.name.text
          }),
        }
        return true
      }
      if (name !== 'defineProps' && name !== 'defineEmits') return false
      const [type] = call.typeArguments ?? []
      if (!type || call.typeArguments.length !== 1 || call.arguments.length)
        problem(
          at(call),
          name === 'defineProps'
            ? 'Declare properties with their types: defineProps<{ title: string }>().'
            : 'Declare events with their arguments: defineEmits<{ saved: [id: string] }>().',
        )
      const slot = name === 'defineProps' ? 'props' : 'emits'
      if (found[slot]) problem(at(call), `${name} is called once.`)
      if (
        slot === 'emits' &&
        ts.isTypeLiteralNode(type) &&
        type.members.some((member) => ts.isCallSignatureDeclaration(member))
      )
        problem(
          at(type),
          'Declare events by name with their arguments: defineEmits<{ saved: [id: string] }>().',
        )
      found[slot] = {
        type: { start: at(type), end: type.getEnd() },
        names: propertyNames(type),
        defaults: [],
        binding,
      }
      return true
    }

    function imported(statement) {
      const from = statement.moduleSpecifier.text
      const clause = statement.importClause
      const named =
        clause?.namedBindings && ts.isNamedImports(clause.namedBindings)
          ? clause.namedBindings.elements
          : []
      const typeOnly = (element) => Boolean(clause?.isTypeOnly || element.isTypeOnly)
      const original = (element) => (element.propertyName ?? element.name).text
      const namedOnly = () => {
        if (!clause || clause.name || !named.length)
          problem(at(statement), `Import what you use from ${from} by name.`)
        for (const element of named)
          if (element.propertyName)
            problem(at(element), `Import ${original(element)} under its own name.`)
      }
      if (from === 'vue') {
        namedOnly()
        for (const element of named) {
          const name = original(element)
          if (
            typeOnly(element)
              ? ['Ref', 'ComputedRef'].includes(name)
              : ['ref', 'computed'].includes(name)
          )
            continue
          unsupported(at(element), `${name} from vue`, vueImports[name])
        }
        return
      }
      if (mavisModules.includes(from) || from === '@getcortexlabs/mavis-core') {
        namedOnly()
        for (const element of named) {
          const name = original(element)
          if (
            typeOnly(element)
              ? mavisTypes.includes(name)
              : from === '@getcortexlabs/mavis-core'
                ? builtInThemes.includes(name)
                : mavisValues.includes(name)
          )
            continue
          if (from === '@getcortexlabs/mavis-core' && !typeOnly(element))
            problem(at(element), themeImport(name, from))
          problem(
            at(element),
            /^M[A-Z]/.test(name)
              ? `${name} is not available on the Mac yet; ${supported}.`
              : `${name} from ${from} is not available to shared screens on the Mac yet.`,
          )
        }
        return
      }
      if (/^(@nativescript\/|nativescript-vue$|@getcortexlabs\/mavis\/)/.test(from))
        problem(
          at(statement),
          `${from} is NativeScript access, which a shared screen cannot use on the Mac. Keep it in the mobile app.`,
        )
      if (/^(vue-router(-ns)?$|nuxt(\/|$)|#app$|#imports$)/.test(from))
        unsupported(at(statement), `Navigation (${from})`, 'screens do not navigate on the Mac yet')
      if (from.startsWith('../') || /^\.\/.*\//.test(from))
        problem(
          at(statement),
          `${from} is in another folder: the Mac compiler reads one flat shared folder. Import ./Name.vue or ./types from this one.`,
        )
      if (!from.startsWith('./'))
        problem(at(statement), `${from} is not available to shared screens on the Mac.`)
      if (clause?.isTypeOnly || (named.length && !clause.name && named.every(typeOnly))) return
      if (from.endsWith('.vue')) {
        const target = from.slice(2, -'.vue'.length)
        if (!clause?.name || clause.namedBindings || !/^[A-Z][A-Za-z0-9]*$/.test(target))
          problem(at(statement), 'Import a shared component as import Name from "./Name.vue".')
        if (clause.name.text !== target)
          problem(at(statement), `Import ${target} under its own name.`)
        found.components.set(target, `shared/${target}.vue`)
        return
      }
      if (/\.lite(\.tsx)?$/.test(from))
        problem(
          at(statement),
          `${from} is a TSX component: a Vue file shows other Vue files, because the Web and NativeScript run it as written.`,
        )
      // A shared module: its constants and functions, by name.
      if (!/^\.\/[a-z][A-Za-z0-9]*(?:-[a-z0-9]+)*(?:\.ts)?$/.test(from))
        problem(
          at(statement),
          `${from} is not a shared module: import ./name, a lowercase .ts file of the shared folder.`,
        )
      if (!clause || clause.name || !named.length)
        problem(at(statement), `Import what you use from ${from} by name.`)
      for (const element of named) if (!typeOnly(element)) found.shared.add(element.name.text)
    }

    function declared(declaration) {
      const { name, initializer } = declaration
      if (!initializer) problem(at(declaration), 'Give this constant a value.')
      const call = ts.isCallExpression(initializer) ? initializer : null
      const callee = call && ts.isIdentifier(call.expression) ? call.expression.text : null
      if (ts.isObjectBindingPattern(name)) {
        if (callee !== 'useMavisPlatform')
          unsupported(at(name), 'Destructuring here', 'only useMavisPlatform() is taken apart')
        for (const element of name.elements) {
          const key = (element.propertyName ?? element.name).getText(file)
          if (
            !ts.isIdentifier(element.name) ||
            element.initializer ||
            element.dotDotDotToken ||
            !(key in macPlatform)
          )
            problem(at(element), `useMavisPlatform() has ${Object.keys(macPlatform).join(', ')}.`)
          found.platform.flags.set(element.name.text, key)
          found.bindings.set(element.name.text, 'flag')
        }
        return
      }
      if (!ts.isIdentifier(name)) unsupported(at(name), 'Destructuring here')
      const bind = (kind) => found.bindings.set(name.text, kind)
      if (call && macro(call, name.text)) return bind(callee === 'defineEmits' ? 'emit' : 'props')
      if (callee === 'useMavisPlatform') {
        found.platform.object = name.text
        return bind('platform')
      }
      if (callee === 'ref') return bind('ref')
      if (callee === 'computed') return bind('computed')
      // What a function of a shared module computes is a constant of the script.
      if (callee && found.shared.has(callee)) return bind('const')
      if (call)
        unsupported(
          at(call),
          `${call.expression.getText(file)}()`,
          'a script declares ref, computed, functions, constants, defineProps, defineEmits and useMavisPlatform',
        )
      if (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) {
        plain(initializer)
        return bind('function')
      }
      bind('const')
    }

    function plain(fn) {
      if (fn.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword))
        unsupported(at(fn), 'An async function', 'async work does not reach the Mac yet')
      if (fn.asteriskToken || fn.typeParameters)
        unsupported(at(fn), 'A generator or generic function')
    }

    for (const statement of file.statements) {
      if (ts.isImportDeclaration(statement)) imported(statement)
      else if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement))
        continue
      else if (ts.isFunctionDeclaration(statement)) {
        if (
          !statement.name ||
          statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        )
          unsupported(at(statement), 'An exported function')
        plain(statement)
        found.bindings.set(statement.name.text, 'function')
      } else if (ts.isVariableStatement(statement)) {
        if (!(statement.declarationList.flags & ts.NodeFlags.Const))
          unsupported(at(statement), 'let and var at the top of the script', 'use const with ref')
        if (statement.modifiers?.length) unsupported(at(statement), 'An exported constant')
        for (const declaration of statement.declarationList.declarations) declared(declaration)
      } else if (ts.isExpressionStatement(statement)) {
        const call = ts.isCallExpression(statement.expression) ? statement.expression : null
        if (call && macro(call, null)) continue
        const name = call && ts.isIdentifier(call.expression) ? call.expression.text : null
        unsupported(
          at(statement),
          name ? `${name}()` : 'A statement at the top of the script',
          (name && vueImports[name]) ?? 'a script declares values, computed values and functions',
        )
      } else
        unsupported(
          at(statement),
          `${ts.tokenToString(statement.getFirstToken(file)?.kind) ?? 'This statement'} at the top of the script`,
        )
    }

    const local = new Set()
    const collect = (node) => {
      if (
        (ts.isVariableDeclaration(node) ||
          ts.isParameter(node) ||
          ts.isFunctionDeclaration(node) ||
          ts.isTypeAliasDeclaration(node) ||
          ts.isInterfaceDeclaration(node) ||
          ts.isImportSpecifier(node) ||
          ts.isImportClause(node)) &&
        node.name &&
        ts.isIdentifier(node.name)
      )
        local.add(node.name.text)
      ts.forEachChild(node, collect)
    }
    collect(file)
    const scan = (node) => {
      if (ts.isIdentifier(node) && browserGlobals.has(node.text) && !local.has(node.text)) {
        const parent = node.parent
        const member =
          (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
          ((ts.isPropertyAssignment(parent) || ts.isPropertySignature(parent)) &&
            parent.name === node)
        if (!member) domAccess(at(node), node.text)
      }
      ts.forEachChild(node, scan)
    }
    scan(file)
    return found
  }

  function domScan(start, end) {
    const code = source.slice(start, end)
    const file = ts.createSourceFile('scan.ts', code, ts.ScriptTarget.Latest, true)
    const visit = (node) => {
      if (ts.isIdentifier(node) && node.text === '$slots')
        unsupported(
          start + node.getStart(file),
          '$slots',
          'a component cannot ask which slots it was given on the Mac yet; give the slot fallback content instead',
        )
      if (
        ts.isIdentifier(node) &&
        browserGlobals.has(node.text) &&
        !aliases.includes(node.text) &&
        !script.bindings.has(node.text) &&
        !script.shared.has(node.text) &&
        !script.props?.names.includes(node.text)
      ) {
        const parent = node.parent
        const member =
          (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
          (ts.isPropertyAssignment(parent) && parent.name === node)
        if (!member) domAccess(start + node.getStart(file), node.text)
      }
      ts.forEachChild(node, visit)
    }
    visit(file)
  }

  function domAccess(offset, name) {
    problem(
      offset,
      `${name} is browser DOM access, which a shared screen cannot use on the Mac. Keep it in the Web app.`,
    )
  }

  /** The value of an expression that only depends on useMavisPlatform(), if it is one. */
  function known(start, end) {
    const file = ts.createSourceFile(
      'known.ts',
      `(${source.slice(start, end)})`,
      ts.ScriptTarget.Latest,
      true,
    )
    const [statement] = file.statements
    if (file.statements.length !== 1 || !ts.isExpressionStatement(statement)) return undefined
    const { platform } = script
    const value = (node) => {
      if (ts.isParenthesizedExpression(node)) return value(node.expression)
      if (node.kind === ts.SyntaxKind.TrueKeyword) return true
      if (node.kind === ts.SyntaxKind.FalseKeyword) return false
      if (ts.isStringLiteral(node)) return node.text
      if (ts.isIdentifier(node))
        return platform.flags.has(node.text)
          ? macPlatform[platform.flags.get(node.text)]
          : undefined
      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === platform.object &&
        node.name.text in macPlatform
      )
        return macPlatform[node.name.text]
      if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
        const operand = value(node.operand)
        return typeof operand === 'boolean' ? !operand : undefined
      }
      if (!ts.isBinaryExpression(node)) return undefined
      const left = value(node.left)
      const right = value(node.right)
      switch (node.operatorToken.kind) {
        case ts.SyntaxKind.AmpersandAmpersandToken:
          if (left === false || right === false) return false
          return left === true ? right : right === true ? left : undefined
        case ts.SyntaxKind.BarBarToken:
          if (left === true || right === true) return true
          return left === false ? right : right === false ? left : undefined
        case ts.SyntaxKind.EqualsEqualsEqualsToken:
          return left === undefined || right === undefined ? undefined : left === right
        case ts.SyntaxKind.ExclamationEqualsEqualsToken:
          return left === undefined || right === undefined ? undefined : left !== right
      }
      return undefined
    }
    const result = value(statement.expression)
    return typeof result === 'boolean' ? result : undefined
  }

  function directive(node, name) {
    return node.props.find((prop) => prop.type === 7 && prop.name === name)
  }
  function span(exp) {
    return { start: exp.loc.start.offset, end: exp.loc.end.offset }
  }
  function blank(node) {
    return node.type === 3 || (node.type === 2 && !node.content.trim())
  }

  function children(nodes) {
    const out = []
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index]
      if (blank(node)) continue
      if (node.type === 2 || node.type === 5)
        problem(node.loc.start.offset + node.loc.source.search(/\S/), 'Put text inside MText.')
      if (node.type !== 1) unsupported(node.loc.start.offset, 'This template node')
      if (directive(node, 'else') || directive(node, 'else-if'))
        problem(node.loc.start.offset, 'v-else and v-else-if follow an element with v-if.')
      if (!directive(node, 'if')) {
        out.push(...element(node))
        continue
      }
      const chain = [node]
      while (index + 1 < nodes.length) {
        const next = nodes.slice(index + 1).find((candidate) => !blank(candidate))
        if (!next || next.type !== 1 || !(directive(next, 'else') || directive(next, 'else-if')))
          break
        index = nodes.indexOf(next)
        chain.push(next)
        if (directive(next, 'else')) break
      }
      out.push(...conditional(chain))
    }
    return out
  }

  // A chain of v-if, v-else-if and v-else. A branch decided by useMavisPlatform() is settled
  // here: the others are for another platform and are not read at all.
  function conditional(chain) {
    const live = []
    for (const node of chain) {
      const test = directive(node, 'if') ?? directive(node, 'else-if')
      if (test && !test.exp) problem(test.loc.start.offset, `${test.rawName} needs a condition.`)
      const decided = test ? known(span(test.exp).start, span(test.exp).end) : true
      if (decided === false) continue
      live.push({ node, test: decided === true ? null : test })
      if (decided === true) break
    }
    if (!live.length) return []
    if (!live[0].test) return element(live[0].node)
    const plan = { kind: 'if', branches: [] }
    live.forEach(({ node, test }, index) => {
      const branch = { when: null, children: [] }
      if (test) {
        glue(index ? ' else if (' : 'if (', test.loc.start.offset)
        branch.when = expression(span(test.exp).start, span(test.exp).end)
        glue(') {\n')
      } else glue(' else {\n', node.loc.start.offset)
      branch.children = element(node)
      glue('}')
      plan.branches.push(branch)
    })
    glue('\n')
    return [plan]
  }

  function element(node) {
    const loop = directive(node, 'for')
    if (!loop) return content(node)
    if (directive(node, 'if') || directive(node, 'else-if') || directive(node, 'else'))
      problem(
        loop.loc.start.offset,
        'v-if and v-for on one element: put the v-if on a <template> around it, or filter the list in a computed value.',
      )
    const parsed = loop.forParseResult
    if (!parsed?.source || !parsed.value)
      problem(loop.loc.start.offset, 'Write v-for as item in list or (item, index) in list.')
    if (parsed.index) unsupported(parsed.index.loc.start.offset, 'A third name in v-for')
    for (const alias of [parsed.value, parsed.key])
      if (alias && !/^[A-Za-z_$][\w$]*$/.test(alias.content))
        unsupported(
          alias.loc.start.offset,
          'Destructuring in v-for',
          'name the item and read its fields',
        )
    const key = node.props.find(
      (prop) => prop.type === 7 && prop.name === 'bind' && prop.arg?.content === 'key',
    )
    if (!key?.exp)
      problem(node.loc.start.offset, 'Give the repeated element a key, for example :key="task.id".')
    glue('for (const [', loop.loc.start.offset)
    copy(span(parsed.value).start, span(parsed.value).end)
    if (parsed.key) {
      glue(', ')
      copy(span(parsed.key).start, span(parsed.key).end)
    }
    glue('] of __mavisEach(')
    const list = expression(span(parsed.source).start, span(parsed.source).end)
    glue(')) {\n')
    aliases.push(parsed.value.content, ...(parsed.key ? [parsed.key.content] : []))
    const keyed = expression(span(key.exp).start, span(key.exp).end)
    glue(';\n')
    const body = content(node, true)
    aliases.length -= parsed.key ? 2 : 1
    glue('}\n', node.loc.end.offset)
    if (body.length !== 1)
      problem(
        node.loc.start.offset,
        'v-for repeats one element; wrap the repeated content in an MColumn or MRow.',
      )
    return [
      {
        kind: 'for',
        list,
        item: parsed.value.content,
        index: parsed.key?.content ?? null,
        key: keyed,
        body: body[0],
        offset: loop.loc.start.offset,
      },
    ]
  }

  // The element itself, once v-if and v-for around it are dealt with.
  function content(node, keyed = false) {
    const offset = node.loc.start.offset
    for (const prop of node.props) {
      if (prop.type !== 7) continue
      if (['if', 'else-if', 'else', 'for'].includes(prop.name)) continue
      if (prop.name === 'bind' && prop.arg?.content === 'key') {
        if (!keyed) problem(prop.loc.start.offset, ':key belongs on the element with v-for.')
        continue
      }
      if (!['bind', 'on', 'model', 'slot'].includes(prop.name))
        unsupported(prop.loc.start.offset, `v-${prop.name}`)
    }
    if (node.tag === 'template') {
      if (node.props.some((prop) => prop.type === 7 && prop.name === 'slot'))
        problem(
          offset,
          '<template #…> goes directly inside the shared component whose slot it fills.',
        )
      if (
        !node.props.some(
          (prop) => prop.type === 7 && ['if', 'else-if', 'else', 'for'].includes(prop.name),
        )
      )
        unsupported(offset, '<template> without v-if or v-for')
      return children(node.children)
    }
    if (node.tag === 'slot') return [slotSite(node)]
    if (
      node.tag === 'component' ||
      node.props.some((prop) => prop.name === 'is' || prop.arg?.content === 'is')
    )
      unsupported(offset, 'A dynamic component (is)')
    const name = pascal(node.tag)
    if (name === 'MPlatform') return platform(node)
    if (primitives[name]) return [primitive(node, name)]
    if (name === 'MReveal') return [reveal(node)]
    if (script.components.has(name)) return [shared(node, name)]
    if (nativeViews.has(node.tag))
      problem(
        offset,
        `<${node.tag}> is a NativeScript view, which a shared screen cannot use on the Mac; ${supported}.`,
      )
    if (node.tagType === 0)
      problem(
        offset,
        `<${node.tag}> is an HTML element, which a shared screen cannot use on the Mac; ${supported}.`,
      )
    if (/^M[A-Z]/.test(name))
      problem(offset, `${name} is not available on the Mac yet; ${supported}.`)
    if (
      [
        'Transition',
        'TransitionGroup',
        'KeepAlive',
        'Teleport',
        'Suspense',
        'RouterLink',
        'RouterView',
        'NuxtLink',
        'NuxtPage',
        'ClientOnly',
      ].includes(name)
    )
      unsupported(offset, `<${node.tag}>`)
    problem(
      offset,
      `<${node.tag}> is not a Mavis primitive or a shared component this file imports.`,
    )
  }

  /** Attributes and events by their camelCase names. */
  function written(node, tag, fills = false, models = null) {
    const attributes = new Map()
    const events = new Map()
    let model
    let ref
    let slot
    const once = (map, name, prop) => {
      if (map.has(name)) problem(prop.loc.start.offset, `${name} is set twice.`)
      map.set(name, prop)
    }
    for (const prop of node.props) {
      const at = prop.loc.start.offset
      if (prop.type === 6) {
        if (prop.name === 'class' || prop.name === 'style')
          unsupported(
            at,
            prop.name,
            'CSS does not reach the Mac; use the layout and typography properties',
          )
        if (prop.name === 'key') problem(at, 'Write the key of a repeated element as :key.')
        if (prop.name === 'ref') ref = prop
        else once(attributes, camel(prop.name), prop)
        continue
      }
      if (prop.name === 'bind') {
        if (!prop.arg) unsupported(at, 'v-bind with an object', 'write each property')
        if (!prop.arg.isStatic) unsupported(at, 'A computed property name')
        const name = camel(prop.arg.content)
        if (name === 'key') continue
        if (name === 'class' || name === 'style')
          unsupported(
            at,
            `:${name}`,
            'CSS does not reach the Mac; use the layout and typography properties',
          )
        if (name === 'ref') unsupported(at, ':ref', 'write ref="name" for a field reference')
        if (prop.modifiers.length)
          unsupported(at, `.${prop.modifiers[0].content} on ${prop.rawName}`)
        if (!prop.exp)
          problem(
            at,
            `Write the value of ${prop.rawName}, for example :${prop.arg.content}="value".`,
          )
        once(attributes, name, prop)
      } else if (prop.name === 'on') {
        if (!prop.arg) unsupported(at, 'v-on with an object', 'write each listener')
        if (!prop.arg.isStatic) unsupported(at, 'A computed event name')
        if (!prop.exp) problem(at, `${prop.rawName} needs a handler.`)
        // Vue's DOM runtime applies them; NativeScript-Vue has none, so the file would not run there.
        if (prop.modifiers.length)
          unsupported(
            at,
            prop.rawName,
            'key and event modifiers are DOM behavior, which NativeScript does not run',
          )
        once(
          events,
          prop.arg.content.startsWith('update:')
            ? `update:${camel(prop.arg.content.slice(7))}`
            : camel(prop.arg.content),
          prop,
        )
      } else if (prop.name === 'model') {
        if (prop.arg && (!models || !prop.arg.isStatic))
          unsupported(at, `v-model:${prop.arg.content}`)
        if (prop.modifiers.length) unsupported(at, `v-model.${prop.modifiers[0].content}`)
        if (!prop.exp) problem(at, 'v-model needs the value it edits.')
        if (prop.arg) once(models, camel(prop.arg.content), prop)
        else {
          if (model) problem(at, 'v-model is set twice.')
          model = prop
        }
      } else if (prop.name === 'slot') {
        if (!fills)
          problem(
            at,
            `v-slot goes on a shared component, or on a <template> directly inside one; <${tag}> has no slots.`,
          )
        slot = prop
      }
    }
    return { attributes, events, model, ref, slot }
  }

  /** `key: value` for an attribute: its text, its expression, or true when written alone. */
  function attribute(key, prop, wrap) {
    const entry = { key, at: text.length, valueless: false }
    glue(`${key}: `, prop.loc.start.offset)
    if (prop.type === 6) {
      if (prop.value) glue(JSON.stringify(prop.value.content), prop.value.loc.start.offset)
      else {
        entry.valueless = true
        glue('true')
      }
    } else {
      if (wrap) glue(`${wrap}(`)
      expression(span(prop.exp).start, span(prop.exp).end)
      if (wrap) glue(')')
    }
    glue(', ')
    return entry
  }

  // A listener as Vue reads it: a function is the handler, a name is called with the event's
  // arguments, and anything else is statements with $event.
  function listener(prop, variadic) {
    const { start, end } = span(prop.exp)
    const code = source.slice(start, end)
    const file = ts.createSourceFile('listener.ts', code, ts.ScriptTarget.Latest, true)
    const [statement] = file.statements
    let single =
      file.statements.length === 1 && ts.isExpressionStatement(statement)
        ? statement.expression
        : null
    while (single && ts.isParenthesizedExpression(single)) single = single.expression
    if (single && ts.isFunctionExpression(single))
      unsupported(start, 'A function expression as a handler', 'write an arrow function')
    domScan(start, end)
    if (single && ts.isArrowFunction(single)) return { kind: 'arrow', ...expression(start, end) }
    if (single && ts.isIdentifier(single)) return { kind: 'method', ...expression(start, end) }
    const usesEvent = /\$event\b/.test(code)
    const at = text.length
    if (variadic) {
      glue('(...__mavisArgs) => {', start)
      if (usesEvent) glue(' const $event = __mavisFirst(__mavisArgs);')
    } else glue(usesEvent ? '($event) => {' : '() => {', start)
    glue(' ')
    copy(start, end)
    glue(' }')
    return { kind: 'inline', at, usesEvent }
  }

  // Text and {{ values }}; with runs, MSpan elements too. MText's own content is trimmed at
  // its ends, a run's is not.
  function texts(nodes, tag, runs = false, trim = true) {
    const parts = []
    const kept = nodes.filter((node) => node.type !== 3)
    kept.forEach((node, index) => {
      if (node.type === 2) {
        let value = node.content
        if (trim && index === 0) value = value.trimStart()
        if (trim && index === kept.length - 1) value = value.trimEnd()
        if (value) parts.push(value)
      } else if (node.type === 5) {
        parts.push({ start: node.content.loc.start.offset, end: node.content.loc.end.offset })
      } else if (runs && node.type === 1 && primitives[pascal(node.tag)]?.inline) {
        parts.push({ span: node })
      } else
        problem(
          node.loc.start.offset,
          runs
            ? `${tag} contains text, {{ values }} and MSpan only.`
            : `${tag} contains text and {{ values }} only.`,
        )
    })
    return parts
  }

  // An MSpan inside MText: its properties are typed like a primitive's, and its content is
  // read like MText's.
  function run(node) {
    const offset = node.loc.start.offset
    const name = pascal(node.tag)
    const spec = primitives[name]
    const { attributes: set, events, model, ref } = written(node, node.tag)
    const keys = ['text', ...Object.keys(spec.props)]
    const only = `${name} takes ${keys.slice(0, -1).join(', ')} and ${keys.at(-1)}.`
    if (model) problem(model.loc.start.offset, only)
    if (ref) problem(ref.loc.start.offset, only)
    for (const prop of events.values()) problem(prop.loc.start.offset, only)
    const entry = { at: text.length, attrs: [], text: [] }
    glue(`__mavis.${name}({ `, offset)
    for (const [key, prop] of set) {
      if (key === 'text') continue
      if (!spec.props[key]) problem(prop.loc.start.offset, only)
      entry.attrs.push(attribute(key, prop))
    }
    const direct = set.get('text')
    const parts = texts(node.children, name, true, false)
    if (direct && parts.length)
      problem(direct.loc.start.offset, `${name} has text and content; use one.`)
    const pending = textChildren(entry.text, direct, parts, offset)
    glue('});\n', offset)
    for (const [holder, child] of pending) holder.span = run(child)
    return entry
  }

  // children: [...] of a text call: strings stay in the plan, values are typed in the call, and
  // each run is lowered after it, in the order the holders it returns give.
  function textChildren(plan, direct, parts, offset) {
    const pending = []
    glue('children: [', offset)
    if (direct?.type === 6) plan.push(direct.value?.content ?? '')
    else if (direct) {
      plan.push(expression(span(direct.exp).start, span(direct.exp).end))
      glue(', ')
    }
    for (const part of parts) {
      if (typeof part === 'string') plan.push(part)
      else if (part.span) {
        const holder = { span: null }
        plan.push(holder)
        pending.push([holder, part.span])
      } else {
        plan.push(expression(part.start, part.end))
        glue(', ')
      }
    }
    glue('] ')
    return pending
  }

  // Whether a bound expression is an object or array written out, as values the Mac reads
  // while the screen is compiled.
  function literal(exp) {
    const { start, end } = span(exp)
    const file = ts.createSourceFile(
      'value.ts',
      `(${source.slice(start, end)})`,
      ts.ScriptTarget.Latest,
      true,
    )
    const written = (value) => {
      while (value && (ts.isParenthesizedExpression(value) || ts.isAsExpression(value)))
        value = value.expression
      if (value && ts.isConditionalExpression(value))
        return written(value.whenTrue) && written(value.whenFalse)
      return Boolean(
        value && (ts.isObjectLiteralExpression(value) || ts.isArrayLiteralExpression(value)),
      )
    }
    return written(file.statements[0]?.expression)
  }

  function primitive(node, name) {
    const offset = node.loc.start.offset
    if (primitives[name].inline) problem(offset, `${name} goes inside MText or another ${name}.`)
    const { spec, attributes, events, source: own } = spelling(name)
    const named = Boolean(spec.slots)
    const models = new Map()
    const {
      attributes: set,
      events: heard,
      model,
      ref,
      slot,
    } = written(node, node.tag, named, models)
    // v-slot on the component itself takes the properties of a default slot that hands some.
    const ownSlot = slot && spec.scoped?.default && (slot.arg?.content ?? 'default') === 'default'
    if (slot && !ownSlot)
      problem(
        slot.loc.start.offset,
        `${name} hands its content nothing: drop ${slot.rawName ?? 'v-slot'}, and give the ${spec.slots[0]} as <template #${spec.slots[0]}> inside ${name}.`,
      )
    const plan = { kind: 'element', name, at: text.length, attrs: [], children: [], offset }
    // <template #overlay>: named content, beside what goes between the tags.
    const templates = named
      ? node.children.filter(
          (child) =>
            child.type === 1 &&
            child.tag === 'template' &&
            child.props.some((prop) => prop.type === 7 && prop.name === 'slot'),
        )
      : []
    const taken = new Set()
    const take = (key, prop) => {
      if (taken.has(key)) problem(prop.loc.start.offset, `${key} is set twice.`)
      taken.add(key)
    }
    const unknown = (prop, what) =>
      problem(
        prop.loc.start.offset,
        `${name} does not take ${what} on the Mac. It supports ${[...attributes.keys(), ...[...events.keys()].map((event) => `@${event}`)].join(', ')}.`,
      )
    const modelled =
      attributes.has('modelValue') && events.has('update:modelValue')
        ? { value: attributes.get('modelValue'), change: events.get('update:modelValue') }
        : null
    if (model && !modelled) unknown(model, 'v-model')
    const flags = Object.entries(own.flags ?? {})
    for (const [key, flag] of flags) {
      const prop = set.get(flag)
      const listening = [...heard.keys()].some((event) => events.get(event) === key)
      if (prop && (prop.type !== 6 || prop.value))
        problem(prop.loc.start.offset, `${flag} is written alone, without a value.`)
      if (listening && !prop)
        problem(
          offset,
          `${name} needs ${flag} to answer ${[...events].find(([, to]) => to === key)[0]}.`,
        )
      if (prop && !listening)
        problem(
          prop.loc.start.offset,
          `${flag} needs @${[...events].find(([, to]) => to === key)[0]}.`,
        )
      set.delete(flag)
    }
    const slotted = own.slot && node.children.some((child) => !blank(child))
    const textual = spec.children === 'text'

    const required = () => {
      const spelled = (key) =>
        [...attributes].find(([, to]) => to === key)?.[0] ??
        `@${[...events].find(([, to]) => to === key)[0]}`
      for (const key of spec.required ?? []) {
        if (taken.has(key)) continue
        if (modelled && [modelled.value, modelled.change].includes(key))
          problem(offset, `${name} needs v-model.`)
        problem(offset, `${name} needs ${spelled(key)}.`)
      }
      for (const [key, attribute] of Object.entries(own.names ?? {}))
        if (taken.has(key) && !taken.has(attributes.get(attribute)))
          problem(offset, `${name} needs ${attribute} with ${spelled(key)}.`)
    }

    glue(`__mavis.${name}({ `, offset)
    for (const [spelled, prop] of set) {
      if (textual && spelled === 'text') continue
      const key = attributes.get(spelled)
      if (!key) unknown(prop, spelled)
      take(key, prop)
      if (slotted && key === own.slot)
        problem(prop.loc.start.offset, `${name} has ${own.slot} and content; use one.`)
      if (own.literals?.[key] && prop.type === 7 && !literal(prop.exp))
        problem(span(prop.exp).start, own.literals[key])
      const kind = spec.props[key]
      plan.attrs.push(attribute(key, prop, kind === 'optional-string' ? '__mavisAbsent' : null))
    }
    if (model) {
      take(modelled.value, model)
      take(modelled.change, model)
      const { start, end } = span(model.exp)
      const kind = spec.props[modelled.value]
      const value = { key: modelled.value, at: text.length, valueless: false }
      glue(`${modelled.value}: `, model.loc.start.offset)
      if (kind === 'optional-string') glue('__mavisAbsent(')
      expression(start, end)
      if (kind === 'optional-string') glue(')')
      glue(', ')
      const change = { key: modelled.change, at: text.length, handler: { kind: 'model' } }
      glue(`${modelled.change}: (__mavisNext) => { `, model.loc.start.offset)
      change.handler.target = expression(start, end)
      glue(' = __mavisNext }, ')
      plan.attrs.push(value, change)
    }
    // v-model:expanded is :expanded with @update:expanded, as Vue reads it.
    for (const [bound, prop] of models) {
      const pair = { value: attributes.get(bound), change: events.get(`update:${bound}`) }
      if (!pair.value || !pair.change) unknown(prop, `v-model:${bound}`)
      take(pair.value, prop)
      take(pair.change, prop)
      const { start, end } = span(prop.exp)
      const value = { key: pair.value, at: text.length, valueless: false }
      glue(`${pair.value}: `, prop.loc.start.offset)
      expression(start, end)
      glue(', ')
      const change = { key: pair.change, at: text.length, handler: { kind: 'model' } }
      glue(`${pair.change}: (__mavisNext) => { `, prop.loc.start.offset)
      change.handler.target = expression(start, end)
      glue(' = __mavisNext }, ')
      plan.attrs.push(value, change)
    }
    const extra = []
    for (const [event, prop] of heard) {
      const key = events.get(event)
      if (!key) unknown(prop, `@${event}`)
      if (model && key === modelled.change) {
        extra.push(prop)
        continue
      }
      take(key, prop)
      const entry = { key, at: text.length }
      glue(`${key}: `, prop.loc.start.offset)
      entry.handler = listener(prop, false)
      glue(', ')
      plan.attrs.push(entry)
    }
    if (slotted) {
      taken.add(own.slot)
      const parts = texts(node.children, name)
      const entry = { key: own.slot, at: text.length, parts: [] }
      glue(`${own.slot}: __mavisText(`, offset)
      for (const part of parts) {
        entry.parts.push(typeof part === 'string' ? part : expression(part.start, part.end))
        if (typeof part === 'string') glue(JSON.stringify(part))
        glue(', ')
      }
      glue('), ')
      plan.attrs.push(entry)
    } else if (
      !textual &&
      !spec.children &&
      !ownSlot &&
      node.children.some((child) => !blank(child) && !templates.includes(child))
    )
      problem(
        offset,
        spec.slots
          ? `${name} takes no children; give its content as ${spec.slots.map((slot) => `<template #${slot}>`).join(' or ')}.`
          : `${name} takes no children; use its properties.`,
      )
    let runs = []
    if (textual) {
      const direct = set.get('text')
      const parts = texts(node.children, name, true)
      if (direct && parts.length)
        problem(direct.loc.start.offset, `${name} has text and content; use one.`)
      plan.text = []
      runs = textChildren(plan.text, direct, parts, offset)
    }
    // A slot that hands its content properties is a function of them, typed by the component.
    const directiveOf = (template) =>
      template.props.find((prop) => prop.type === 7 && prop.name === 'slot')
    const scopedFills = templates.filter((template) => {
      const directive = directiveOf(template)
      return directive.arg?.isStatic && spec.scoped?.[directive.arg.content]
    })
    if (ownSlot && templates.length)
      problem(
        templates[0].loc.start.offset,
        `v-slot on ${name} fills its default slot; with other slots, give each one, the default too, a <template #name> inside ${name}.`,
      )
    const scopedPlans = []
    for (const filled of [
      ...(ownSlot ? [{ fill: 'default', directive: slot, nodes: node.children, at: offset }] : []),
      ...scopedFills.map((template) => ({
        fill: directiveOf(template).arg.content,
        directive: directiveOf(template),
        nodes: template.children,
        at: template.loc.start.offset,
      })),
    ]) {
      const { fill, directive, nodes, at } = filled
      const property =
        fill === 'default' ? 'children' : `slot${fill.charAt(0).toUpperCase()}${fill.slice(1)}`
      const example = fill === 'default' ? 'v-slot="{ item }"' : `#${fill}="{ item }"`
      if (!directive.exp)
        problem(
          at,
          `The ${fill} slot of ${name} hands its content properties: take what you need, as ${example}.`,
        )
      const { start, end } = span(directive.exp)
      const pattern = ts.createSourceFile(
        'fill.ts',
        `(${source.slice(start, end)}) => 0`,
        ts.ScriptTarget.Latest,
        true,
      )
      const [statement] = pattern.statements
      const arrow = statement && ts.isExpressionStatement(statement) ? statement.expression : null
      const parameter = arrow && ts.isArrowFunction(arrow) ? arrow.parameters[0] : null
      if (!parameter || !ts.isObjectBindingPattern(parameter.name))
        problem(start, `Take the slot's properties apart by name, for example ${example}.`)
      const names = parameter.name.elements.map((element) => element.name.getText(pattern))
      const entry = { name: fill, scoped: true, at: text.length, children: [] }
      glue(`${property}: (`, at)
      copy(start, end)
      glue(') => {\n')
      aliases.push(...names)
      entry.children = children(nodes)
      aliases.length -= names.length
      glue('return __mavisElement\n}, ', at)
      scopedPlans.push(entry)
    }
    required()
    glue('});\n', offset)
    for (const [holder, child] of runs) holder.span = run(child)
    // The model's handler and the listener beside it: both run, the model first.
    for (const prop of extra) {
      const change = plan.attrs.find((entry) => entry.key === modelled.change)
      const kind = spec.props[modelled.change]
      glue(
        `__mavisHandle<(value: ${kind.ts ?? handlerValues[kind] ?? 'string'}) => void>(`,
        prop.loc.start.offset,
      )
      change.handler.also = listener(prop, false)
      glue(');\n')
    }
    if (ref) {
      if (!attributes.has('ref')) unknown(ref, 'ref')
      if (!ref.value || !/^[A-Za-z_$][\w$]*$/.test(ref.value.content))
        problem(ref.loc.start.offset, 'ref names a field reference declared in the script.')
      const at = text.length
      glue('(', ref.loc.start.offset)
      glue(ref.value.content, ref.value.loc.start.offset + 1)
      glue(');\n')
      plan.ref = { at }
    }
    if (spec.children === 'elements')
      plan.children = children(node.children.filter((child) => !templates.includes(child)))
    if (templates.length || scopedPlans.length) plan.slots = [...scopedPlans]
    for (const template of templates) {
      const directive = template.props.find((prop) => prop.type === 7 && prop.name === 'slot')
      const at = template.loc.start.offset
      for (const prop of template.props)
        if (prop !== directive)
          unsupported(
            prop.loc.start.offset,
            `${prop.rawName ?? prop.name} on a slot's <template>`,
            'a slot is filled or not; choose inside it what to show',
          )
      if (!directive.arg) problem(at, `Name the slot: <template #${spec.slots[0]}>.`)
      if (!directive.arg.isStatic)
        unsupported(at, 'A dynamic slot name', `name the slot, as in #${spec.slots[0]}`)
      const fill = directive.arg.content
      if (fill === 'default' && !spec.scoped?.default)
        problem(at, `Put the content of ${name} directly inside it, without <template #default>.`)
      if (!spec.slots.includes(fill))
        problem(at, `${name} has no slot ${fill}; its slots are ${spec.slots.join(', ')}.`)
      if (
        plan.slots.filter((other) => other.name === fill).length >
        (scopedFills.includes(template) ? 1 : 0)
      )
        problem(at, `${name} gets content for ${fill} twice.`)
      if (scopedFills.includes(template)) continue
      if (directive.exp)
        problem(
          span(directive.exp).start,
          `The ${fill} slot of ${name} hands its content nothing; drop ="${source.slice(span(directive.exp).start, span(directive.exp).end)}".`,
        )
      plan.slots.push({ name: fill, at, children: children(template.children) })
    }
    return plan
  }

  function reveal(node) {
    const offset = node.loc.start.offset
    const { attributes, events, model, ref } = written(node, node.tag)
    const show = attributes.get('show')
    if (!show || show.type !== 7) problem(offset, 'MReveal needs :show.')
    const gap = attributes.get('gap')
    for (const [name, prop] of attributes)
      if (name !== 'show' && name !== 'gap')
        problem(prop.loc.start.offset, `MReveal takes show and gap on the Mac, not ${name}.`)
    for (const prop of [...events.values(), model, ref].filter(Boolean))
      problem(prop.loc.start.offset, 'MReveal takes show and gap on the Mac.')
    const plan = { kind: 'reveal', at: text.length, offset, gap: null }
    glue('__mavis.MReveal({ show: ', offset)
    plan.when = expression(span(show.exp).start, span(show.exp).end)
    glue(', ')
    if (gap) plan.gap = attribute('gap', gap)
    glue('});\n{\n')
    plan.children = children(node.children)
    glue('}\n')
    return plan
  }

  // <MPlatform only="…">: the Mac shows the content when macos is named, the fallback otherwise.
  function platform(node) {
    const offset = node.loc.start.offset
    const { attributes } = written(node, node.tag)
    const only = attributes.get('only')
    let targets
    if (only?.type === 6) targets = [only.value?.content]
    else if (only?.exp) {
      const { start, end } = span(only.exp)
      const file = ts.createSourceFile(
        'only.ts',
        `(${source.slice(start, end)})`,
        ts.ScriptTarget.Latest,
        true,
      )
      const [statement] = file.statements
      let value = statement && ts.isExpressionStatement(statement) ? statement.expression : null
      while (value && ts.isParenthesizedExpression(value)) value = value.expression
      if (value && ts.isStringLiteral(value)) targets = [value.text]
      else if (
        value &&
        ts.isArrayLiteralExpression(value) &&
        value.elements.every(ts.isStringLiteral)
      )
        targets = value.elements.map((item) => item.text)
    }
    if (!targets || attributes.size !== 1)
      problem(
        offset,
        'MPlatform takes only, written out: only="macos" or :only="[\'web\', \'macos\']".',
      )
    // Checked against the contract like any property; the Mac keeps only the branch it shows.
    glue('__mavis.MPlatform({ ', offset)
    attribute('only', only)
    glue('});\n', offset)
    const fallback = node.children.filter(
      (child) =>
        child.type === 1 &&
        child.tag === 'template' &&
        child.props.some((prop) => prop.type === 7 && prop.name === 'slot'),
    )
    for (const slot of fallback) {
      const name = slot.props.find((prop) => prop.name === 'slot').arg?.content ?? 'default'
      if (name !== 'fallback') unsupported(slot.loc.start.offset, `The ${name} slot of MPlatform`)
    }
    return targets.includes('macos')
      ? children(node.children.filter((child) => !fallback.includes(child)))
      : fallback.flatMap((slot) => children(slot.children))
  }

  function shared(node, name) {
    const offset = node.loc.start.offset
    const { attributes, events, model, ref, slot } = written(node, node.tag, true)
    if (model)
      unsupported(
        model.loc.start.offset,
        `v-model on ${name}`,
        'pass a value and listen to an event',
      )
    if (ref) unsupported(ref.loc.start.offset, `ref on ${name}`)
    const filled = fills(node, name, slot)
    const plan = { kind: 'component', name, at: text.length, attrs: [], slots: [], offset }
    glue(`__mavisUse(${name}, { `, offset)
    for (const [key, prop] of attributes) plan.attrs.push(attribute(key, prop))
    for (const [event, prop] of events) {
      if (!/^[a-z][A-Za-z0-9]*$/.test(event))
        unsupported(
          prop.loc.start.offset,
          `${prop.rawName} on ${name}`,
          'events have plain camelCase names and no modifiers',
        )
      const key = `on${event.charAt(0).toUpperCase()}${event.slice(1)}`
      const entry = { key, at: text.length }
      glue(`${key}: `, prop.loc.start.offset)
      entry.handler = listener(prop, true)
      glue(', ')
      plan.attrs.push(entry)
    }
    glue('}', offset)
    if (filled.length) {
      // Each slot's content is a function of what the slot hands it, typed by the component.
      glue(', { ')
      for (const fill of filled) {
        const entry = { name: fill.name, at: text.length, children: [] }
        glue(`${fill.name}: (`, fill.at)
        if (fill.directive?.exp) copy(span(fill.directive.exp).start, span(fill.directive.exp).end)
        glue(') => {\n')
        aliases.push(...fill.names)
        entry.children = children(fill.nodes)
        aliases.length -= fill.names.length
        glue('}, ', fill.at)
        plan.slots.push(entry)
      }
      glue('}')
    }
    glue(');\n', offset)
    return plan
  }

  // What a parent passes to a component's slots: content between its tags is the default
  // slot, a <template #name> fills the slot of that name, and v-slot on the component itself
  // takes the default slot's properties.
  function fills(node, name, own) {
    const known = slotsOf(script.components.get(name))
    const filling = (child) =>
      child.type === 1 &&
      child.tag === 'template' &&
      child.props.some((prop) => prop.type === 7 && prop.name === 'slot')
    const templates = node.children.filter(filling)
    const loose = node.children.filter((child) => !filling(child) && !blank(child))
    const out = []
    if (own) {
      if (templates.length)
        problem(
          templates[0].loc.start.offset,
          `v-slot on ${name} fills its default slot; with other slots, give each one, the default too, a <template #name> inside ${name}.`,
        )
      out.push({ directive: own, nodes: node.children, at: own.loc.start.offset })
    } else {
      if (loose.length) out.push({ directive: null, nodes: loose, at: loose[0].loc.start.offset })
      for (const template of templates) {
        const directive = template.props.find((prop) => prop.type === 7 && prop.name === 'slot')
        for (const prop of template.props)
          if (prop !== directive)
            unsupported(
              prop.loc.start.offset,
              `${prop.rawName ?? prop.name} on a slot's <template>`,
              'a slot is filled or not; choose inside it what to show',
            )
        out.push({ directive, nodes: template.children, at: template.loc.start.offset })
      }
    }
    for (const fill of out) {
      const directive = fill.directive
      if (directive?.arg && !directive.arg.isStatic)
        unsupported(
          directive.loc.start.offset,
          'A dynamic slot name',
          'name the slot, as in #header',
        )
      fill.name = directive?.arg
        ? slotName(directive.arg.content, directive.loc.start.offset)
        : 'default'
      if (out.filter((other) => other.name === fill.name).length > 1)
        problem(fill.at, `${name} gets content for ${fill.name} twice.`)
      if (known && !known.names.includes(fill.name))
        problem(
          fill.at,
          `${name} has no slot ${fill.name}; ${known.names.length ? `its slots are ${known.names.join(', ')}` : 'it shows no slots'}.`,
        )
      fill.names = []
      if (!directive?.exp) continue
      const { start, end } = span(directive.exp)
      if (known && !known.scoped.has(fill.name))
        problem(
          start,
          `The slot ${fill.name} of ${name} hands its content nothing; drop ="${source.slice(start, end)}".`,
        )
      const pattern = ts.createSourceFile(
        'fill.ts',
        `(${source.slice(start, end)}) => 0`,
        ts.ScriptTarget.Latest,
        true,
      )
      const [statement] = pattern.statements
      const arrow = statement && ts.isExpressionStatement(statement) ? statement.expression : null
      const parameter = arrow && ts.isArrowFunction(arrow) ? arrow.parameters[0] : null
      if (!parameter || !ts.isObjectBindingPattern(parameter.name))
        problem(
          start,
          `Take the slot's properties apart by name, for example #${fill.name}="{ item }".`,
        )
      fill.names = parameter.name.elements.map((element) => element.name.getText(pattern))
    }
    return out
  }

  function slotName(value, at) {
    if (!/^[a-z][A-Za-z0-9]*$/.test(value))
      problem(
        at,
        `Name a slot with letters and digits, for example headerTitle: ${value ? `"${value}"` : 'an empty name'} is not one every target can use.`,
      )
    return value
  }

  // <slot />, <slot name="header">fallback</slot> and, declared with defineSlots,
  // <slot name="row" :item="item" />.
  function slotSite(node) {
    const offset = node.loc.start.offset
    let name = 'default'
    const args = []
    for (const prop of node.props) {
      const at = prop.loc.start.offset
      if (prop.type === 6) {
        if (prop.name === 'name') name = slotName(prop.value?.content ?? '', at)
        else args.push([camel(prop.name), prop])
        continue
      }
      if (['if', 'else-if', 'else', 'for'].includes(prop.name)) continue
      if (prop.name !== 'bind') unsupported(at, `v-${prop.name} on <slot>`)
      if (!prop.arg) unsupported(at, 'v-bind with an object on <slot>', 'write each property')
      if (!prop.arg.isStatic) unsupported(at, 'A computed slot property name')
      if (prop.arg.content === 'key') continue
      if (prop.arg.content === 'name')
        unsupported(
          at,
          ':name on <slot>',
          'Vue reads it as a dynamic slot name; name the slot with name="…", and call a property it hands its content something else',
        )
      if (prop.modifiers.length) unsupported(at, `.${prop.modifiers[0].content} on ${prop.rawName}`)
      if (!prop.exp) problem(at, `Write the value of ${prop.rawName}.`)
      args.push([camel(prop.arg.content), prop])
    }
    if (args.length && !script.slots)
      problem(
        offset,
        `The slot ${name} hands its content ${args.map(([key]) => key).join(', ')}: declare what it hands with defineSlots<{ ${name}(props: { ${args.map(([key]) => `${key}: …`).join('; ')} }): unknown }>().`,
      )
    if (script.slots && !script.slots.names.includes(name))
      problem(offset, `The slot ${name} is not declared in defineSlots.`)
    const plan = { kind: 'slot', name, at: text.length, offset, fallback: [] }
    if (!shownSlots.some((slot) => slot.name === name)) shownSlots.push({ name, at: plan.at })
    glue(`__mavisSlotProps(${JSON.stringify(name)}, { `, offset)
    for (const [key, prop] of args) attribute(key, prop)
    glue('});\n{\n', offset)
    plan.fallback = children(node.children)
    glue('}\n', node.loc.end.offset)
    return plan
  }
}
