// JavaScript and template text shared by the Vue emitter and the component modules.
import { moduleNames } from './model.mjs'

export const tsType = (type) => {
  switch (type.k) {
    case 'opaque':
      return type.name
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
    case 'refresh':
      return 'RefreshContext'
    case 'combobox-search':
      return 'ComboboxSearchContext'
    default:
      return 'void'
  }
}

export const jsString = (text) =>
  `'${text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')}'`

export const template = (text) =>
  text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

export function js(e) {
  switch (e.e) {
    case 'owned-function':
      return handlerJs(e.callback)
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
    case 'narrowed':
      return js(e.source)
    case 'controller':
      return e.ref
    case 'controller-value':
      return `${e.ref}.${e.field}`
    case 'controller-call':
      return `${e.standalone ? e.method : `${e.object ? js(e.object) : e.ref}.${e.method}`}(${e.callback ? [...(e.args ?? []).map(js), handlerJs(e.callback)].join(', ') : e.args ? e.args.map(js).join(', ') : `{ ${e.options.map((option) => `${option.name}: ${js(option.value)}`).join(', ')} }`})`
    case 'length':
      return `${wrap(e.object)}.length`
    case 'field':
      return `${wrap(e.object)}${e.optional ? '?.' : '.'}${e.name}`
    case 'call':
      return `${e.object.e === 'lit' && typeof e.object.value === 'number' ? `(${js(e.object)})` : wrap(e.object)}.${e.method}(${e.args.map(js).join(', ')})`
    case 'const':
      return `${moduleNames(e.module).js}.${e.name}`
    case 'invoke':
      return `${moduleNames(e.module).js}.${e.name}(${e.args.map(js).join(', ')})`
    case 'convert':
      return `${e.type.k === 'number' ? 'Number' : 'String'}(${js(e.arg)})`
    case 'check':
      return `Number.${e.fn}(${js(e.arg)})`
    case 'store':
      return `${e.store}.${e.name}.value`
    case 'cancelled':
      return e.signal ? `${e.ref}.signal.aborted` : `${e.ref}.cancelled`
    case 'spread':
      return `[${e.lists.map((list) => (list.e === 'array' ? list.items.map(js).join(', ') : `...${js(list)}`)).join(', ')}]`
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
export const wrap = (e) =>
  [
    'state',
    'getter',
    'prop',
    'local',
    'field',
    'call',
    'length',
    'lit',
    'array',
    'math',
    'const',
    'invoke',
    'convert',
    'check',
    'spread',
    'store',
  ].includes(e.e) && !(e.e === 'lit' && typeof e.value === 'number' && e.value < 0)
    ? js(e)
    : `(${js(e)})`

const path = (target) =>
  (target.store
    ? [target.store, target.name, 'value', ...target.fields]
    : ['state', target.name, ...target.fields]
  ).join('.')

export function statements(list, indent) {
  const pad = ' '.repeat(indent)
  return list
    .map((s) => {
      switch (s.s) {
        case 'assign':
          return `${pad}${path(s.target)} ${s.op} ${js(s.value)}`
        case 'const':
          return `${pad}const ${s.name} = ${js(s.value)}`
        case 'invoke-callback':
          return `${pad}${js(s.callable)}(${s.args.map(js).join(', ')})`
        case 'return':
          return s.value ? `${pad}return ${js(s.value)}` : `${pad}return`
        case 'guard':
          if (s.else)
            return `${pad}if (${s.name} === undefined) {\n${statements(s.else, indent + 2)}\n${pad}}`
          return `${pad}if (${s.name} === undefined) return${s.value ? ` ${js(s.value)}` : ''}`
        case 'iflet': {
          const otherwise = s.else.length
            ? ` else {\n${statements(s.else, indent + 2)}\n${pad}}`
            : ''
          return `${pad}if (${s.name} !== undefined) {\n${statements(s.then, indent + 2)}\n${pad}}${otherwise}`
        }
        case 'throw':
          return `${pad}throw new Error(${js(s.message)})`
        case 'await-value':
          return `${pad}${s.into ? `const ${s.into} = ` : ''}await ${js(s.value)}`
        case 'action':
          return `${pad}${s.into ? `const ${s.into} = ` : ''}${s.await ? 'await ' : ''}state.${s.name}(${s.args.map(js).join(', ')})`
        case 'store':
          return `${pad}${s.into ? `const ${s.into} = ` : ''}${s.await ? 'await ' : ''}${s.store}.${s.name}(${s.args.map(js).join(', ')})`
        case 'service':
          return `${pad}${s.into ? `const ${s.into} = ` : ''}${s.await ? 'await ' : ''}${s.dep}.${s.method}(${s.args.map(js).join(', ')})`
        case 'commit':
          return `${pad}${s.into ? `const ${s.into} = ` : ''}await ${s.ref}.commit(() => {\n${statements(s.body, indent + 2)}\n${pad}})`
        case 'try':
          return [
            `${pad}try {`,
            statements(s.body, indent + 2),
            ...(s.catch ? [`${pad}} catch {`, statements(s.catch, indent + 2)] : []),
            ...(s.finally.length ? [`${pad}} finally {`, statements(s.finally, indent + 2)] : []),
            `${pad}}`,
          ]
            .filter(Boolean)
            .join('\n')
        case 'cancel-cleanup':
          return `${pad}${s.ref}.onCancel(() => {\n${statements(s.body, indent + 2)}\n${pad}})`
        case 'navigate':
          return `${pad}mavisNavigation.${s.method}(${s.href ? js(s.href) : ''})`
        case 'focus':
        case 'blur':
          return `${pad}${s.ref}.value?.${s.s}()`
        case 'scroll':
          return `${pad}${s.ref}.value?.scrollToIndex(${js(s.index)})`
        case 'call':
          return `${pad}${s.await ? 'await ' : ''}${s.standalone ? s.method : `${s.object ? js(s.object) : s.ref}.${s.method}`}(${s.callback ? [...(s.args ?? []).map(js), handlerJs(s.callback)].join(', ') : s.args ? s.args.map(js).join(', ') : s.options ? `{ ${s.options.map((option) => `${option.name}: ${js(option.value)}`).join(', ')} }` : ''})`
        case 'callback':
          return `${pad}props.${s.name}${s.optional ? '?.' : ''}(${s.args.map(js).join(', ')})`
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

export const attribute = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

/**
 * Generated JavaScript as it goes into a template. The Vue compiler decodes character
 * references such as &amp; there, and a double quote ends an attribute value, so both are
 * written as JavaScript escapes inside string and template literals. Operators stay as
 * written: vue-tsc reads the expression from the file, where &amp;&amp; is not JavaScript.
 */
export function embed(code, quoted) {
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
export const expression = (code) => embed(code, true)

export function handlerJs(handler) {
  const params = handler.params
    .filter((param) => !param.unused)
    .map((param) => param.name)
    .join(', ')
  if (handler.body.length === 1 && !['if', 'const', 'return', 'try'].includes(handler.body[0].s))
    return `${handler.async ? 'async ' : ''}(${params}) => ${statements(handler.body, 0)}`
  return `${handler.async ? 'async ' : ''}(${params}) => {\n${statements(handler.body, 2)}\n}`
}
