// Vue output: the model printed back as JavaScript, so the Web runs the source's own semantics.

const tsType = (type) => {
  switch (type.k) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'record':
      return type.name
    case 'array':
      return `${type.of.k === 'optional' || type.of.k === 'function' ? `(${tsType(type.of)})` : tsType(type.of)}[]`
    case 'optional':
      return `${tsType(type.of)} | undefined`
    case 'function':
      return `(${type.params.map((param, i) => `arg${i}: ${tsType(param)}`).join(', ')}) => void`
    default:
      return 'void'
  }
}

const jsString = (text) =>
  `'${text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')}'`

const template = (text) => text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

export function js(e) {
  switch (e.e) {
    case 'lit':
      return typeof e.value === 'string'
        ? jsString(e.value)
        : Object.is(e.value, -0)
          ? '-0'
          : String(e.value)
    case 'undefined':
      return 'undefined'
    case 'template':
      return `\`${e.parts.map((part) => (typeof part === 'string' ? template(part) : `\${${js(part)}}`)).join('')}\``
    case 'state':
    case 'getter':
      return `state.${e.name}`
    case 'prop':
      return `props.${e.name}`
    case 'local':
      return e.name
    case 'length':
      return `${wrap(e.object)}.length`
    case 'field':
      return `${wrap(e.object)}${e.optional ? '?.' : '.'}${e.name}`
    case 'call':
      return `${wrap(e.object)}.${e.method}(${e.args.map(js).join(', ')})`
    case 'math':
      return `Math.${e.fn}(${e.args.map(js).join(', ')})`
    case 'arrow':
      return `(${e.params.join(', ')}) => ${e.body.e === 'record' ? `(${js(e.body)})` : js(e.body)}`
    case 'index':
      return `${wrap(e.object)}[${js(e.index)}]`
    case 'unary':
      return `${e.op}${wrap(e.arg)}`
    case 'binary':
      return `(${js(e.left)} ${e.op === 'concat' ? '+' : e.op} ${js(e.right)})`
    case 'logical':
      return `(${js(e.left)} ${e.op} ${js(e.right)})`
    case 'cond':
      return `(${js(e.test)} ? ${js(e.then)} : ${js(e.else)})`
    case 'record':
      return `{ ${[...(e.spread ? [`...${js(e.spread)}`] : []), ...e.fields.map((field) => `${field.name}: ${js(field.value)}`)].join(', ')} }`
    case 'array':
      return `[${e.items.map(js).join(', ')}]`
  }
  throw new Error(`Unknown expression ${e.e}`)
}
const wrap = (e) =>
  ['state', 'getter', 'prop', 'local', 'field', 'call', 'length', 'lit', 'array', 'math'].includes(
    e.e,
  ) && !(e.e === 'lit' && typeof e.value === 'number' && e.value < 0)
    ? js(e)
    : `(${js(e)})`

const path = (target) => ['state', target.name, ...target.fields].join('.')

export function statements(list, indent) {
  const pad = ' '.repeat(indent)
  return list
    .map((s) => {
      switch (s.s) {
        case 'assign':
          return `${pad}${path(s.target)} ${s.op} ${js(s.value)}`
        case 'const':
          return `${pad}const ${s.name} = ${js(s.value)}`
        case 'return':
          return `${pad}return`
        case 'guard':
          return `${pad}if (${s.name} === undefined) return`
        case 'iflet': {
          const otherwise = s.else.length
            ? ` else {\n${statements(s.else, indent + 2)}\n${pad}}`
            : ''
          return `${pad}if (${s.name} !== undefined) {\n${statements(s.then, indent + 2)}\n${pad}}${otherwise}`
        }
        case 'action':
          return `${pad}state.${s.name}(${s.args.map(js).join(', ')})`
        case 'focus':
        case 'blur':
          return `${pad}${s.ref}.value?.${s.s}()`
        case 'callback':
          return `${pad}props.${s.name}(${s.args.map(js).join(', ')})`
        case 'push':
        case 'unshift':
          return `${pad}${path(s.target)}.${s.s}(${js(s.value)})`
        case 'splice':
          return `${pad}${path(s.target)}.splice(${[s.start, s.deleteCount, ...s.items].map(js).join(', ')})`
        case 'if': {
          const otherwise =
            s.else.length === 1 && s.else[0].s === 'if'
              ? ` else ${statements(s.else, indent).trimStart()}`
              : s.else.length
                ? ` else {\n${statements(s.else, indent + 2)}\n${pad}}`
                : ''
          return `${pad}if (${js(s.test)}) {\n${statements(s.then, indent + 2)}\n${pad}}${otherwise}`
        }
      }
      throw new Error(`Unknown statement ${s.s}`)
    })
    .join('\n')
}

const attribute = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

/**
 * Generated JavaScript as it goes into a template. The Vue compiler decodes character
 * references such as &amp; there, and a double quote ends an attribute value, so both are
 * written as JavaScript escapes inside string and template literals. Operators stay as
 * written: vue-tsc reads the expression from the file, where &amp;&amp; is not JavaScript.
 */
function embed(code, quoted) {
  let out = ''
  const open = []
  for (let index = 0; index < code.length; index++) {
    const char = code[index]
    const top = open.at(-1)
    if (top === "'" || top === '`') {
      if (char === '\\') out += char + code[++index]
      else if (char === top) {
        open.pop()
        out += char
      } else if (top === '`' && char === '$' && code[index + 1] === '{') {
        open.push('{')
        out += '${'
        index++
      } else if (char === '&') out += '\\x26'
      else if (char === '"' && quoted) out += '\\x22'
      else out += char
      continue
    }
    if (char === "'" || char === '`') open.push(char)
    else if (char === '{' && top === '{') open.push('{')
    else if (char === '}' && top === '{') open.pop()
    else if (char === '"' && quoted) throw new Error('Unexpected double quote in generated code.')
    out += char
  }
  return out
}
const expression = (code) => embed(code, true)

function handlerJs(handler) {
  const params = handler.params
    .filter((param) => !param.unused)
    .map((param) => param.name)
    .join(', ')
  if (handler.body.length === 1 && !['if', 'const', 'return'].includes(handler.body[0].s))
    return `(${params}) => ${statements(handler.body, 0)}`
  return `(${params}) => {\n${statements(handler.body, 2)}\n}`
}

function textContent(parts) {
  const simple =
    parts.every((part) => typeof part === 'string') && !/[<>&{}]|^\s|\s$|\s\s/.test(parts.join(''))
  if (simple) return parts.join('')
  const literal =
    parts.length === 1 && typeof parts[0] !== 'string'
      ? js(parts[0])
      : `\`${parts.map((part) => (typeof part === 'string' ? template(part) : `\${${js(part)}}`)).join('')}\``
  return `{{ ${embed(literal, false).replace(/}}/g, '} }')} }}`
}

// Source property names that differ from the Mavis Web component's.
const renamed = {
  MInput: { value: 'modelValue', onChange: 'update:modelValue', onEscape: 'keydown.esc' },
  MCheckbox: { checked: 'modelValue', onChange: 'update:modelValue' },
  MSelect: { value: 'modelValue', onChange: 'update:modelValue' },
  MColumn: { label: 'accessibilityLabel' },
  MRow: { label: 'accessibilityLabel' },
  MCard: { label: 'accessibilityLabel' },
}

// One emitVue call at a time: the host flavor and the list regions of the component being printed.
let target = 'web'
let regions = new Map()

// Hardware keys and DOM focus repair only exist in the Web flavor.
const webOnly = (name) => name === 'onKeyDown' || name === 'onEscape'

const walk = (node, visit) => {
  visit(node)
  children(node).forEach((child) => walk(child, visit))
}
const nodesWhere = (view, test) => {
  const found = []
  walk(view, (node) => test(node) && found.push(node))
  return found
}

function props(node) {
  const names = renamed[node.tag] ?? {}
  const entries = Object.entries(node.props).filter(([name]) => target === 'web' || !webOnly(name))
  const attributes = entries.map(([name, value]) => {
    if (name === 'onKeyDown')
      return `tabindex="0" @keydown="${expression(`(event) => mavisKey(event, ${handlerJs(value)})`)}"`
    // The card paints with a theme color; shortcuts are registered in the script.
    if (node.tag === 'MCard' && name === 'tone')
      return `:backgroundColor="${expression('lit' in value ? `mavisTheme.colors.${value.lit}` : `mavisTheme.colors[${js(value.expr)} as keyof typeof mavisTheme.colors]`)}"`
    if (node.tag === 'MCard' && name === 'onClick')
      return `interactive @click="${expression(handlerJs(value))}"`
    if (name === 'shortcut') return ''
    // MSelect reports string or number choices; these options are strings.
    if (node.tag === 'MSelect' && name === 'onChange' && value.params.some((p) => !p.unused))
      return `@update:modelValue="${expression(`(choice) => (${handlerJs(value)})(String(choice))`)}"`
    const target = names[name] ?? name
    if ('ref' in value) return `ref="${value.ref}"`
    if ('body' in value)
      return `@${target.startsWith('on') ? target[2].toLowerCase() + target.slice(3) : target}="${expression(handlerJs(value))}"`
    if ('lit' in value) return `${target}="${attribute(value.lit)}"`
    // MSelect takes null for no choice; the source writes undefined.
    if (node.tag === 'MSelect' && name === 'value')
      return `:${target}="${expression(`${js(value.expr)} ?? null`)}"`
    return `:${target}="${expression(js(value.expr))}"`
  })
  if (target === 'web' && (node.tag === 'MColumn' || node.tag === 'MRow') && node.props.label)
    attributes.unshift('role="group"')
  if (regions.has(node)) attributes.push(`:motionRegion="${regions.get(node).name}"`)
  return attributes
    .filter(Boolean)
    .map((text) => ` ${text}`)
    .join('')
}

function render(nodes, indent) {
  const pad = ' '.repeat(indent)
  return nodes
    .map((node) => {
      switch (node.v) {
        case 'text':
          return `${pad}<MText${props(node)}>${textContent(node.parts)}</MText>`
        case 'element': {
          const keep = listParent(node) ? ' v-mavis-keep-focus' : ''
          return node.children.length
            ? `${pad}<${node.tag}${props(node)}${keep}>\n${render(node.children, indent + 2)}\n${pad}</${node.tag}>`
            : `${pad}<${node.tag}${props(node)} />`
        }
        case 'component':
          return `${pad}<${node.name}${node.props
            .map(({ name, value }) =>
              value.handler
                ? ` :${name}="${expression(handlerJs(value.handler))}"`
                : ` :${name}="${expression(js(value.expr))}"`,
            )
            .join('')} />`
        case 'show': {
          if (node.animate) {
            // MReveal keeps leaving content until its exit finishes, with the column's spacing.
            const gap = node.gap ? ` gap="${node.gap}"` : ''
            const reveal = (when, body) =>
              `${pad}<MReveal :show="${expression(when)}"${gap}>\n${render(body, indent + 2)}\n${pad}</MReveal>`
            const shown = js(node.when)
            return [
              reveal(shown, node.then),
              ...(node.else.length ? [reveal(`!${wrap(node.when)}`, node.else)] : []),
            ].join('\n')
          }
          const then = `${pad}<template v-if="${expression(js(node.when))}">\n${render(node.then, indent + 2)}\n${pad}</template>`
          return node.else.length
            ? `${then}\n${pad}<template v-else>\n${render(node.else, indent + 2)}\n${pad}</template>`
            : then
        }
        case 'for': {
          const alias = node.index ? `(${node.item}, ${node.index})` : node.item
          const key = node.key ? `${node.item}.${node.key}` : node.item
          return `${pad}<template v-for="${alias} in ${expression(js(node.each))}" :key="${key}">\n${render([node.body], indent + 2)}\n${pad}</template>`
        }
      }
      throw new Error(`Unknown view ${node.v}`)
    })
    .join('\n')
}

const runtimeProp = (type) => {
  const base = type.k === 'optional' ? type.of : type
  const constructor = {
    string: 'String',
    number: 'Number',
    boolean: 'Boolean',
    record: 'Object',
    array: 'Array',
    function: 'Function',
  }[base.k]
  const cast = ['record', 'array', 'function'].includes(base.k)
    ? ` as PropType<${tsType(base)}>`
    : ''
  return `{ type: ${constructor}${cast}, required: ${type.k !== 'optional'} }`
}

const animatedFor = (node) =>
  children(node)
    .map((child) =>
      child.v === 'for' && child.animate ? child : child.v === 'show' ? animatedFor(child) : null,
    )
    .find(Boolean)

/** target 'web' prints for Mavis Web in a browser, 'native' for Mavis on NativeScript. */
export function emitVue(component, header, { target: flavor = 'web' } = {}) {
  target = flavor
  regions = new Map()
  const visit = (node) => {
    if (node.animatesList) {
      const list = animatedFor(node)
      regions.set(node, { name: `mavisRows${regions.size + 1}`, list })
    }
    children(node).forEach(visit)
  }
  visit(component.view)
  const records = new Set()
  const collect = (type) => {
    if (type.k === 'record') records.add(type.name)
    if (type.of) collect(type.of)
    if (type.params) type.params.forEach(collect)
  }
  component.props.forEach((prop) => collect(prop.type))
  component.state.forEach((value) => collect(value.type))
  component.getters.forEach((getter) => collect(getter.type))
  component.actions.forEach((action) => action.params.forEach((param) => collect(param.type)))
  const needsPropType = component.props.some((prop) =>
    ['record', 'array', 'function'].includes(
      (prop.type.k === 'optional' ? prop.type.of : prop.type).k,
    ),
  )
  const lines = [`<!-- ${header} -->`, '<script setup lang="ts">']
  const vueImports = [
    ...(component.state.length || component.getters.length || component.actions.length
      ? ['reactive']
      : []),
    ...(component.refs.length ? ['ref'] : []),
    ...(needsPropType ? ['type PropType'] : []),
  ]
  if (vueImports.length) lines.push(`import { ${vueImports.join(', ')} } from 'vue'`)
  for (const name of [...component.imports.keys()].sort())
    lines.push(`import ${name} from './${name}.vue'`)
  if (records.size) lines.push(`import type { ${[...records].sort().join(', ')} } from './types'`)
  const shortcuts =
    flavor === 'web'
      ? nodesWhere(component.view, (node) => node.tag === 'MButton' && node.props.shortcut)
      : []
  const themed = nodesWhere(
    component.view,
    (node) => node.tag === 'MCard' && node.props.tone,
  ).length
  const helpers = [
    ...(flavor === 'web' && usesKeys(component.view) ? ['mavisKey'] : []),
    ...(shortcuts.length ? ['useMavisShortcuts'] : []),
    ...(hasFor(component.view) ? ['vMavisKeepFocus'] : []),
  ]
  if (helpers.length) lines.push(`import { ${helpers.join(', ')} } from './runtime'`)
  // Keyed list layout runs through the renderer's Jolt adapter on both hosts.
  const core = [
    ...(regions.size ? ['useComponentLayout'] : []),
    ...(themed ? ['useMavisTheme'] : []),
  ]
  if (core.length) lines.push(`import { ${core.join(', ')} } from '@getcortexlabs/mavis-core/vue'`)
  lines.push('')
  for (const reference of component.refs)
    lines.push(`const ${reference.name} = ref<{ focus(): void; blur(): void }>()`)
  if (component.props.length) {
    lines.push('const props = defineProps({')
    for (const prop of component.props) lines.push(`  ${prop.name}: ${runtimeProp(prop.type)},`)
    lines.push('})')
  }
  const members = [
    ...component.state.map(
      (value) =>
        `  ${value.name}: ${js(value.init)}${['record', 'array', 'optional'].includes(value.type.k) || value.init.e === 'lit' ? ` as ${tsType(value.type)}` : ''},`,
    ),
    ...component.getters.map((getter) =>
      [
        `  get ${getter.name}(): ${tsType(getter.type)} {`,
        ...getter.locals.map((local) => `    const ${local.name} = ${js(local.value)}`),
        `    return ${js(getter.expr)}`,
        '  },',
      ].join('\n'),
    ),
    ...component.actions.map((action) =>
      [
        `  ${action.name}(${action.params.map((param) => `${param.name}: ${tsType(param.type)}`).join(', ')}): void {`,
        statements(action.body, 4),
        '  },',
      ]
        .filter(Boolean)
        .join('\n'),
    ),
  ]
  if (members.length) lines.push('const state = reactive({', ...members, '})')
  if (themed) lines.push('const { theme: mavisTheme } = useMavisTheme()')
  if (shortcuts.length)
    lines.push(
      'useMavisShortcuts([',
      ...shortcuts.map(
        ({ props: button }) =>
          `  { key: ${jsString(button.shortcut.lit.slice(4))}, ${button.disabled ? `disabled: () => ${js(button.disabled.expr)}, ` : ''}run: ${handlerJs(button.onClick)} },`,
      ),
      '])',
    )
  for (const { name, list } of regions.values())
    lines.push(
      `const ${name} = useComponentLayout(() => ${wrap(list.each)}.map((${list.item}) => ${list.key ? `${list.item}.${list.key}` : list.item}))`,
    )
  lines.push('</script>', '', '<template>', render([component.view], 2), '</template>', '')
  return lines.join('\n')
}

const children = (node) => [
  ...(node.children ?? []),
  ...(node.then ?? []),
  ...(node.else ?? []),
  ...(node.body ? [node.body] : []),
]
export const usesKeys = (node) => Boolean(node.props?.onKeyDown) || children(node).some(usesKeys)
const hasFor = (node) => node.v === 'for' || children(node).some(hasFor)
// A For whose rows are this element's DOM children, through Show and For but no other element.
const listParent = (node) =>
  children(node).some((child) => child.v === 'for' || (child.v === 'show' && listParent(child)))
const usesShortcuts = (node) =>
  Boolean(node.tag === 'MButton' && node.props.shortcut) || children(node).some(usesShortcuts)
export const usesRuntime = (node, flavor = 'web') =>
  (flavor === 'web' && (usesKeys(node) || usesShortcuts(node))) || hasFor(node)

/** NativeScript's runtime: the same focus repair, on NativeScript views. */
export function emitVueNativeRuntime(header) {
  return `// ${header}
import type { Directive } from 'vue'
import { TextField, TextView, isIOS, type View } from '@nativescript/core'

type Editor = TextField | TextView
type Child = { nativeView?: View }
type Parent = Child & {
  insertBefore(child: Child, anchor: unknown): void
  appendChild(child: Child): void
}
type Selection = { ios?: unknown; start?: number; end?: number }

function focusedEditor(root: View | undefined): Editor | undefined {
  let found: Editor | undefined
  const visit = (view: View) => {
    if (found) return
    if ((view instanceof TextField || view instanceof TextView) && hasFocus(view)) found = view
    view.eachChildView((child) => {
      visit(child)
      return !found
    })
  }
  if (root) visit(root)
  return found
}

const hasFocus = (view: View) =>
  isIOS ? Boolean(view.ios?.isFirstResponder) : Boolean(view.android?.hasFocus())

function selection(editor: Editor): Selection {
  if (isIOS) return { ios: editor.ios?.selectedTextRange }
  const native = editor.android as { getSelectionStart(): number; getSelectionEnd(): number }
  return { start: native.getSelectionStart(), end: native.getSelectionEnd() }
}

function restore(editor: Editor, saved: Selection) {
  editor.focus()
  if (isIOS) {
    if (saved.ios) editor.ios.selectedTextRange = saved.ios
  } else if (saved.start !== undefined && saved.end !== undefined)
    (editor.android as { setSelection(start: number, end: number): void }).setSelection(
      saved.start,
      saved.end,
    )
}

/**
 * On the element whose children are a keyed list. NativeScript-Vue moves a row by removing
 * and adding its view, which ends editing: when the row holds the focused field, focus and
 * the text selection go back to it.
 */
export const vMavisKeepFocus: Directive<Parent> = {
  mounted(element) {
    const keep = (child: Child, move: () => void) => {
      const editor = focusedEditor(child.nativeView)
      const saved = editor && selection(editor)
      move()
      if (editor && saved && !hasFocus(editor)) restore(editor, saved)
    }
    const insertBefore = element.insertBefore.bind(element)
    const appendChild = element.appendChild.bind(element)
    element.insertBefore = (child, anchor) => keep(child, () => insertBefore(child, anchor))
    element.appendChild = (child) => keep(child, () => appendChild(child))
  },
  beforeUnmount(element) {
    Reflect.deleteProperty(element, 'insertBefore')
    Reflect.deleteProperty(element, 'appendChild')
  },
}
`
}

/** Shared by the generated components that handle keys on a stack. */
export function emitVueRuntime(header) {
  return `// ${header}
import { onBeforeUnmount, onMounted, type Directive } from 'vue'

export type MavisKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

const keys = new Set<string>(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])

/** Keys pressed while a stack or one of its rows has focus. Text editing keeps its own keys. */
export function mavisKey(event: KeyboardEvent, handle: (key: MavisKey) => void) {
  if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
  if (!keys.has(event.key)) return
  const target = event.target as Element | null
  if (target?.closest('input, textarea, select, [contenteditable]')) return
  event.preventDefault()
  handle(event.key as MavisKey)
}

type Shortcut = { key: string; disabled?: () => boolean; run: () => void }

/** Control or Command with a key, anywhere on the page, for the buttons that declare one. */
export function useMavisShortcuts(shortcuts: Shortcut[]) {
  const listen = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.repeat || event.altKey || event.shiftKey) return
    if (!event.metaKey && !event.ctrlKey) return
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    const match = shortcuts.find((shortcut) => shortcut.key === key)
    if (!match) return
    event.preventDefault()
    if (!match.disabled?.()) match.run()
  }
  // Before the focused field sees the key, as a menu shortcut would be.
  onMounted(() => document.addEventListener('keydown', listen, true))
  onBeforeUnmount(() => document.removeEventListener('keydown', listen, true))
}

const editable = (element: Element): element is HTMLInputElement | HTMLTextAreaElement =>
  element instanceof HTMLTextAreaElement ||
  (element instanceof HTMLInputElement && element.selectionStart !== null)

type Mover = Element & { moveBefore?: (node: Node, child: Node | null) => void }

/**
 * On the element whose children are a keyed list. Vue reorders rows with insertBefore,
 * and browsers drop focus from a moved element: an edited row would lose its caret.
 * Moves that carry the focused element use moveBefore where the browser has it, or put
 * focus and the text selection back right away.
 */
export const vMavisKeepFocus: Directive<HTMLElement> = {
  mounted(element) {
    const insert = element.insertBefore
    element.insertBefore = function <T extends Node>(this: Mover, node: T, child: Node | null): T {
      const active = document.activeElement
      if (!node.isConnected || !(active instanceof HTMLElement) || !node.contains(active))
        return insert.call(this, node, child) as T
      if (typeof this.moveBefore === 'function') {
        try {
          this.moveBefore(node, child)
          return node
        } catch {}
      }
      const selection = editable(active)
        ? ([active.selectionStart, active.selectionEnd, active.selectionDirection] as const)
        : undefined
      insert.call(this, node, child)
      active.focus({ preventScroll: true })
      if (selection && editable(active) && selection[0] !== null && selection[1] !== null)
        active.setSelectionRange(selection[0], selection[1], selection[2] ?? undefined)
      return node
    }
  },
  beforeUnmount(element) {
    Reflect.deleteProperty(element, 'insertBefore')
  },
}
`
}

export function emitVueTypes(records, header) {
  return [
    `// ${header}`,
    ...records.map(
      (record) =>
        `export type ${record.name} = {\n${record.fields.map((field) => `  ${field.name}: ${tsType(field.type)}`).join('\n')}\n}`,
    ),
    '',
  ].join('\n')
}
