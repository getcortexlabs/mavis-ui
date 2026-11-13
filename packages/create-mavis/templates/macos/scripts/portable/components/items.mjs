// Lists of records a component takes, such as the tabs of MTabs or the destinations of MTabBar:
// any record type with the fields the contract names. The Mac runtime keeps its own type for
// each, so it does not depend on a project's records; a list is mapped to it where it is passed.

/** A field of an item: text and flag are the kinds, required unless it can be left out. */
export const text = { k: 'string' }
/** A public ChoiceValue retains numeric/textual identity in runtime records. */
export const choice = { k: 'choice' }
/** Left out, the runtime's own default applies: the field is optional there too. */
export const optionalText = { k: 'string', optional: true }
/** Left out, the text is empty. */
export const emptyText = { k: 'string', optional: true, fallback: '""' }
export const flag = { k: 'boolean', optional: true, fallback: 'false' }
/** A list of records inside each item, such as a group's destinations. */
export const nested = (shape, type) => ({ list: shape, type })

const base = (type) => (type.k === 'optional' ? type.of : type)

function fits(record, shape, fields) {
  const own = fields(record)
  return Object.entries(shape).every(([name, kind]) => {
    const field = own.find((each) => each.name === name)
    if (!field) return Boolean(kind.optional)
    if (field.type.k === 'optional' && !kind.optional) return false
    const type = base(field.type)
    if (kind.list)
      return type.k === 'array' && type.of.k === 'record' && fits(type.of.name, kind.list, fields)
    return kind.k === 'choice' ? ['string', 'number', 'choice'].includes(type.k) : type.k === kind.k
  })
}

/**
 * Reads a property that is a list of items. shape names each field in the order of the runtime
 * type's own; message says what the component takes when the list does not fit.
 */
export const items =
  (shape, message) =>
  ({ attribute, value, ctx, expr, fail, fields }) => {
    const list = expr(value, ctx)
    const record = list.type.k === 'array' && list.type.of.k === 'record' ? list.type.of.name : null
    if (!record || !fits(record, shape, fields)) fail(attribute, message)
    return { expr: list, record }
  }

function fieldArguments(record, shape, name, emit, depth) {
  const own = emit.records.get(record).fields
  return Object.entries(shape).flatMap(([field, kind]) => {
    const found = own.find((each) => each.name === field)
    if (!found) return []
    const read = `${name}.${field}`
    if (kind.list) {
      const inner = `inner${depth}`
      return [
        `${field}: ${read}.map { ${inner} in ${kind.type}(${fieldArguments(base(found.type).of.name, kind.list, inner, emit, depth + 1).join(', ')}) }`,
      ]
    }
    if (kind.k === 'choice') return [`${field}: mavisChoice(${read})`]
    return [
      `${field}: ${read}${found.type.k === 'optional' && kind.fallback ? ` ?? ${kind.fallback}` : ''}`,
    ]
  })
}

/** The list as the runtime's type: self.tabs.map { item in MavisTab(value: item.value, …) }. */
export const mapped = (prop, shape, type, emit) =>
  `${emit.wrap(prop.expr)}.map { item in ${type}(${fieldArguments(prop.record, shape, 'item', emit, 1).join(', ')}) }`

/** A number checked while generating when it is a literal, as the Web checks it while rendering. */
export const bounded =
  (key, test, message) =>
  ({ value, ctx, expr, attribute, fail, T }) => {
    const number = expr(value, ctx, T.number)
    if (number.e === 'lit' && !test(number.value)) fail(attribute, `${key} ${message}`)
    return { expr: number }
  }

/** A choice written as a literal or computed, checked while generating when it is a literal. */
export const oneOf =
  (key, values) =>
  ({ value, ctx, expr, attribute, fail, ts, T }) => {
    if (!ts.isStringLiteral(value)) return { expr: expr(value, ctx, T.string) }
    if (!values.includes(value.text))
      fail(attribute, `${key} is ${values.slice(0, -1).join(', ')} or ${values.at(-1)}.`)
    return { lit: value.text }
  }

/** name: value for each property the source set, as arguments of a Swift initializer. */
export const settings = (props, keys, emit) =>
  keys.flatMap((key) => (props[key] ? [`${key}: ${emit.value(props[key])}`] : []))
export const handlers = (props, keys, emit, indent) =>
  keys.flatMap((key) => (props[key] ? [`${key}: ${emit.handler(props[key], indent + 4)}`] : []))

/** Name(…) with one argument on each line. */
export function call(name, args, indent) {
  const pad = ' '.repeat(indent)
  return [`${pad}${name}(`, args.map((arg) => `${pad}    ${arg}`).join(',\n'), `${pad})`]
}

/** The current value a source keeps, as Vue's modelValue: undefined in the source is null there. */
export const model = {
  rename: { value: 'modelValue', onChange: 'update:modelValue' },
}
