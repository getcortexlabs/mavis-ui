import { posix } from 'node:path'
// Vue output: the model printed back as JavaScript, so the Web runs the source's own semantics.
import { components } from './components/index.mjs'
import { moduleNames } from './model.mjs'
import { vueEffects } from './effects.mjs'
import { children, animatedFor, nodesWhere } from './tree.mjs'
import { callsNavigation } from './navigation/routes.mjs'
import {
  attribute,
  embed,
  expression,
  handlerJs,
  js,
  statements,
  template,
  tsType,
  wrap,
} from './js-text.mjs'

export { js, statements }

// Text with MSpan runs, on one line: Vue keeps a space between runs there, and anything its
// whitespace rules or HTML would change goes in as a value.
function inlineContent(parts) {
  return parts
    .map((part) => {
      if (part && part.v === 'span')
        return `<MSpan${props({ tag: 'MSpan', props: part.props })}>${inlineContent(part.parts)}</MSpan>`
      if (typeof part !== 'string' || /[<>&{}\n]|\s\s/.test(part))
        return `{{ ${embed(typeof part === 'string' ? js({ e: 'lit', value: part, type: { k: 'string' } }) : js(part), false).replace(/}}/g, '} }')} }}`
      return part
    })
    .join('')
}

function textContent(parts) {
  if (parts.some((part) => part && part.v === 'span')) return inlineContent(parts)
  const simple =
    parts.every((part) => typeof part === 'string') && !/[<>&{}]|^\s|\s$|\s\s/.test(parts.join(''))
  if (simple) return parts.join('')
  const literal =
    parts.length === 1 && typeof parts[0] !== 'string'
      ? js(parts[0])
      : `\`${parts.map((part) => (typeof part === 'string' ? template(part) : `\${${js(part)}}`)).join('')}\``
  return `{{ ${embed(literal, false).replace(/}}/g, '} }')} }}`
}

// One emitVue call at a time: the host flavor and the list regions of the component being printed.
let target = 'web'
let regions = new Map()

// What each component adds to the script: runtime helpers, core imports and setup lines.
const scripts = (view, flavor, shared = '#shared-ui', sourceRoot = 'shared') =>
  Object.entries(components).flatMap(([tag, { vue }]) =>
    vue?.script
      ? [
          vue.script(
            nodesWhere(view, (node) => node.tag === tag),
            { target: flavor, shared, sourceRoot, relative: posix.relative },
          ),
        ]
      : [],
  )

function props(node) {
  const { vue = {} } = components[node.tag]
  const entries = Object.entries(node.props).filter(
    ([name]) => target === 'web' || !vue.webOnly?.includes(name),
  )
  const attributes = entries.map(([name, value]) => {
    const custom = vue.attribute?.(name, value)
    if (custom !== undefined) return custom
    const target = vue.rename?.[name] ?? name
    if ('ref' in value) return `ref="${value.ref}"`
    if ('body' in value)
      return `@${target.startsWith('on') ? target[2].toLowerCase() + target.slice(3) : target}="${expression(handlerJs(value))}"`
    if ('lit' in value) return `${target}="${attribute(value.lit)}"`
    return `:${target}="${expression(js(value.expr))}"`
  })
  if (target === 'web') attributes.unshift(...(vue.webAttributes?.(node) ?? []))
  if (regions.has(node)) attributes.push(`:motionRegion="${regions.get(node).name}"`)
  return attributes
    .filter(Boolean)
    .map((text) => ` ${text}`)
    .join('')
}

// What a slot's content takes of the properties the slot hands it: ="{ item, index: i }".
function scope(params = []) {
  const taken = params.filter((param) => !param.unused)
  return taken.length
    ? `="{ ${taken.map((param) => (param.param === param.name ? param.name : `${param.param}: ${param.name}`)).join(', ')} }"`
    : ''
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
          const content = [
            ...(node.slots ?? [])
              .filter((slot) => slot.body.length)
              .map(
                ({ name, params, body }) =>
                  `${pad}  <template #${name}${scope(params)}>\n${render(body, indent + 4)}\n${pad}  </template>`,
              ),
            ...(node.children.length ? [render(node.children, indent + 2)] : []),
          ]
          return content.length
            ? `${pad}<${node.tag}${props(node)}${keep}>\n${content.join('\n')}\n${pad}</${node.tag}>`
            : `${pad}<${node.tag}${props(node)} />`
        }
        case 'component': {
          const open = `${pad}<${node.name}${node.props
            .map(({ name, value }) =>
              value.handler
                ? ` :${name}="${expression(handlerJs(value.handler))}"`
                : ` :${name}="${expression(js(value.expr))}"`,
            )
            .join('')}`
          if (!node.slots.length) return `${open} />`
          const fills = node.slots.map(({ name, params, body }) =>
            body.length
              ? `${pad}  <template #${name}${scope(params)}>\n${render(body, indent + 4)}\n${pad}  </template>`
              : `${pad}  <template #${name}${scope(params)} />`,
          )
          return `${open}>\n${fills.join('\n')}\n${pad}</${node.name}>`
        }
        case 'slot': {
          const named = node.name === 'default' ? '' : ` name="${node.name}"`
          const args = node.args
            .map(({ name, value }) => ` :${name}="${expression(js(value))}"`)
            .join('')
          return node.fallback.length
            ? `${pad}<slot${named}${args}>\n${render(node.fallback, indent + 2)}\n${pad}</slot>`
            : `${pad}<slot${named}${args} />`
        }
        case 'show': {
          if (node.animate) {
            // MReveal keeps leaving content until its exit finishes, with the column's spacing.
            const gap = !node.gap
              ? ''
              : 'lit' in node.gap
                ? ` gap="${node.gap.lit}"`
                : ` :gap="${expression(js(node.gap.expr))}"`
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

// The shared modules a component reads, by name: every const and invoke in what it holds.
function modulesOf(value, found = new Set()) {
  if (!value || typeof value !== 'object') return found
  if ((value.e === 'const' || value.e === 'invoke') && typeof value.module === 'string')
    found.add(value.module)
  for (const item of value instanceof Map ? value.values() : Object.values(value))
    modulesOf(item, found)
  return found
}

const runtimeProp = ({ type, default: fallback, optional }) => {
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
  // Vue reads a missing boolean as false unless its default says undefined.
  if (fallback)
    return `{ type: ${constructor}${cast}, required: false${fallback.e === 'undefined' ? (base.k === 'boolean' ? ', default: undefined' : '') : `, default: ${js(fallback)}`} }`
  return `{ type: ${constructor}${cast}, required: ${type.k !== 'optional' && !optional} }`
}

/** target 'web' prints for Mavis Web in a browser, 'native' for Mavis on NativeScript. */
export function emitVue(
  component,
  header,
  {
    target: flavor = 'web',
    shared = '#shared-ui',
    modulePaths = new Map(),
    sourceRoot = 'shared',
  } = {},
) {
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
  component.slots.forEach((slot) => slot.params.forEach((param) => collect(param.type)))
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
    ...(component.refs.some((reference) => !reference.owner) ? ['ref'] : []),
    ...vueEffects(component).imports,
    ...(needsPropType ? ['type PropType'] : []),
  ]
  if (vueImports.length) lines.push(`import { ${vueImports.join(', ')} } from 'vue'`)
  for (const name of [...component.imports.keys()].sort())
    lines.push(`import ${name} from './${name}.vue'`)
  if (records.size) lines.push(`import type { ${[...records].sort().join(', ')} } from './types'`)
  if (component.actions.some((action) => action.params.some((param) => param.type.k === 'refresh')))
    lines.push("import type { RefreshContext } from '@getcortexlabs/mavis-core'")
  // A shared module runs as written: the generated screen imports the file itself.
  const stores = component.stores ?? []
  for (const name of [
    ...new Set([...modulesOf(component), ...stores.map((use) => use.module)]),
  ].sort())
    lines.push(
      `import * as ${moduleNames(name).js} from '${shared}/${modulePaths.get(name) ?? name}'`,
    )
  const script = scripts(component.view, flavor, shared, sourceRoot)
  for (const reference of component.refs) {
    const render = reference.owner && components[reference.owner].composable.vue
    if (render) script.push(render(reference, js))
  }
  // What its actions and handlers call: the navigation each host installs.
  if (callsNavigation(component))
    script.push({
      core: ['useMavisNavigation'],
      setup: ['const mavisNavigation = useMavisNavigation()'],
    })
  const helpers = [
    ...new Set(script.flatMap((part) => part.runtime ?? [])),
    ...(hasFor(component.view) ? ['vMavisKeepFocus'] : []),
  ]
  if (helpers.length) lines.push(`import { ${helpers.join(', ')} } from './runtime'`)
  // Keyed list layout runs through the renderer's Jolt adapter on both hosts.
  const core = [
    ...(regions.size ? ['useComponentLayout'] : []),
    ...new Set(script.flatMap((part) => part.core ?? [])),
  ]
  if (core.length) lines.push(`import { ${core.join(', ')} } from '@getcortexlabs/mavis-core/vue'`)
  const imported = new Map()
  for (const part of script)
    for (const [from, names] of Object.entries(part.imports ?? {}))
      imported.set(from, [...new Set([...(imported.get(from) ?? []), ...names])].sort())
  for (const [from, names] of [...imported].sort())
    lines.push(`import { ${names.join(', ')} } from '${from}'`)
  lines.push('')
  for (const use of stores)
    lines.push(`const ${use.name} = ${moduleNames(use.module).js}.${use.accessor}()`)
  for (const reference of component.refs.filter((reference) => !reference.owner))
    lines.push(
      `const ${reference.name} = ref<{ ${reference.kind === 'list' ? 'scrollToIndex(index: number): void' : 'focus(): void; blur(): void'} }>()`,
    )
  if (component.props.length) {
    lines.push('const props = defineProps({')
    for (const prop of component.props) lines.push(`  ${prop.name}: ${runtimeProp(prop)},`)
    lines.push('})')
  }
  if (component.slots.length) {
    lines.push('defineSlots<{')
    for (const slot of component.slots)
      lines.push(
        `  ${slot.name}?: (${slot.params.length ? `props: { ${slot.params.map((param) => `${param.name}: ${tsType(param.type)}`).join('; ')} }` : ''}) => unknown`,
      )
    lines.push('}>()')
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
        `  ${action.async ? 'async ' : ''}${action.name}(${action.params.map((param) => `${param.name}: ${tsType(param.type)}`).join(', ')}): ${action.async ? 'Promise<void>' : 'void'} {`,
        statements(action.body, 4),
        '  },',
      ]
        .filter(Boolean)
        .join('\n'),
    ),
  ]
  if (members.length) lines.push('const state = reactive({', ...members, '})')
  lines.push(...vueEffects(component).lines)
  lines.push(...script.flatMap((part) => part.setup ?? []))
  for (const { name, list } of regions.values())
    lines.push(
      `const ${name} = useComponentLayout(() => ${wrap(list.each)}.map((${list.item}) => ${list.key ? `${list.item}.${list.key}` : list.item}))`,
    )
  lines.push('</script>', '', '<template>', render([component.view], 2), '</template>', '')
  return lines.join('\n')
}

const hasFor = (node) => node.v === 'for' || children(node).some(hasFor)
// A For whose rows are this element's DOM children, through Show and For but no other element.
const listParent = (node) =>
  children(node).some((child) => child.v === 'for' || (child.v === 'show' && listParent(child)))
export const usesRuntime = (view, flavor = 'web') =>
  hasFor(view) || scripts(view, flavor).some((part) => part.runtime?.length)

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

/** The Web runtime: each component's helpers, then the focus repair for keyed lists. */
export function emitVueRuntime(header) {
  const parts = Object.values(components).flatMap(({ vue }) => (vue?.runtime ? [vue.runtime] : []))
  const imports = [...parts.flatMap((part) => part.imports ?? []), 'type Directive']
  return [
    `// ${header}\nimport { ${imports.join(', ')} } from 'vue'`,
    ...parts.map((part) => part.source),
    keepFocus,
  ]
    .join('\n\n')
    .concat('\n')
}

const keepFocus = `const editable = (element: Element): element is HTMLInputElement | HTMLTextAreaElement =>
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
}`

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
