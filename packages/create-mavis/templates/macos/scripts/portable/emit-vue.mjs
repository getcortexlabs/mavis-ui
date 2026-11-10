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
      return `(${e.param}) => ${e.body.e === 'record' ? `(${js(e.body)})` : js(e.body)}`
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
  const params = handler.params.map((param) => param.name).join(', ')
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

function props(node) {
  return Object.entries(node.props)
    .map(([name, value]) =>
      name === 'onClick'
        ? `@click="${attribute(handlerJs(value))}"`
        : 'lit' in value
          ? `${name}="${attribute(value.lit)}"`
          : `:${name}="${attribute(js(value.expr))}"`,
    )
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
        case 'element':
          return node.children.length
            ? `${pad}<${node.tag}${props(node)}>\n${render(node.children, indent + 2)}\n${pad}</${node.tag}>`
            : `${pad}<${node.tag}${props(node)} />`
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
    ...(needsPropType ? ['type PropType'] : []),
  ]
  if (vueImports.length) lines.push(`import { ${vueImports.join(', ')} } from 'vue'`)
  for (const name of [...component.imports.keys()].sort())
    lines.push(`import ${name} from './${name}.vue'`)
  if (records.size) lines.push(`import type { ${[...records].sort().join(', ')} } from './types'`)
  lines.push('')
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
