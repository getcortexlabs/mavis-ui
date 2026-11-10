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
  return `{{ ${literal.replace(/}}/g, '} }')} }}`
}

// Source property names that differ from the Mavis Web component's.
const renamed = {
  MInput: { value: 'modelValue', onChange: 'update:modelValue', onEscape: 'keydown.esc' },
  MCheckbox: { checked: 'modelValue', onChange: 'update:modelValue' },
  MSelect: { value: 'modelValue', onChange: 'update:modelValue' },
  MColumn: { label: 'accessibilityLabel' },
  MRow: { label: 'accessibilityLabel' },
}

function props(node) {
  const names = renamed[node.tag] ?? {}
  const attributes = Object.entries(node.props).map(([name, value]) => {
    if (name === 'onKeyDown')
      return `tabindex="0" @keydown="${attribute(`(event) => mavisKey(event, ${handlerJs(value)})`)}"`
    const target = names[name] ?? name
    if ('ref' in value) return `ref="${value.ref}"`
    if ('body' in value)
      return `@${target.startsWith('on') ? target[2].toLowerCase() + target.slice(3) : target}="${attribute(handlerJs(value))}"`
    if ('lit' in value) return `${target}="${attribute(value.lit)}"`
    // MSelect takes null for no choice; the source writes undefined.
    if (node.tag === 'MSelect' && name === 'value')
      return `:${target}="${attribute(`${js(value.expr)} ?? null`)}"`
    return `:${target}="${attribute(js(value.expr))}"`
  })
  if ((node.tag === 'MColumn' || node.tag === 'MRow') && node.props.label)
    attributes.unshift('role="group"')
  return attributes.map((text) => ` ${text}`).join('')
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
                ? ` :${name}="${attribute(handlerJs(value.handler))}"`
                : ` :${name}="${attribute(js(value.expr))}"`,
            )
            .join('')} />`
        case 'show': {
          const then = `${pad}<template v-if="${attribute(js(node.when))}">\n${render(node.then, indent + 2)}\n${pad}</template>`
          return node.else.length
            ? `${then}\n${pad}<template v-else>\n${render(node.else, indent + 2)}\n${pad}</template>`
            : then
        }
        case 'for': {
          const alias = node.index ? `(${node.item}, ${node.index})` : node.item
          const key = node.key ? `${node.item}.${node.key}` : node.item
          return `${pad}<template v-for="${alias} in ${attribute(js(node.each))}" :key="${key}">\n${render([node.body], indent + 2)}\n${pad}</template>`
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

export function emitVue(component, header) {
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
  const helpers = [
    ...(usesKeys(component.view) ? ['mavisKey'] : []),
    ...(hasFor(component.view) ? ['vMavisKeepFocus'] : []),
  ]
  if (helpers.length) lines.push(`import { ${helpers.join(', ')} } from './runtime'`)
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
export const usesRuntime = (node) => usesKeys(node) || hasFor(node)

/** Shared by the generated components that handle keys on a stack. */
export function emitVueRuntime(header) {
  return `// ${header}
import type { Directive } from 'vue'

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
