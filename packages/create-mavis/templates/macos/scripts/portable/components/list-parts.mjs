// What the list and data components share: events that hand back their own types, lists of
// records read by the fields a contract names, and the SwiftUI pieces their rows are made of.

/**
 * An event whose listener receives values of the component's own types. params names them:
 * ({ T, record, type }) => [types], where type(name) is the type of another property the
 * source sets, for an event that hands back what the source gave.
 */
export const event = (params) =>
  Object.assign(
    ({ value, ctx, handler, T, record, type }) => handler(value, params({ T, record, type }), ctx),
    { event: params },
  )

const base = (type) => (type.k === 'optional' ? type.of : type)

/**
 * A list of records with the fields a contract names. wanted maps each field to its type
 * ('string', 'number', 'boolean') and whether every record has it: { id: 'string', limit:
 * 'number?' }. The property keeps the record's name and the optional fields it declares.
 */
export const records =
  (component, what, wanted, example) =>
  ({ attribute, value, ctx, expr, fail, fields }) => {
    const list = expr(value, ctx)
    const record = list.type.k === 'array' && list.type.of.k === 'record' ? list.type.of.name : null
    if (!record)
      fail(attribute, `${component} takes ${what} as a list of records, such as ${example}.`)
    const own = fields(record)
    const has = {}
    for (const [name, spec] of Object.entries(wanted)) {
      const optional = spec.endsWith('?')
      const kind = optional ? spec.slice(0, -1) : spec
      const field = own.find((each) => each.name === name)
      if (!field) {
        if (!optional)
          fail(attribute, `Every one of the ${what} needs ${name}, a ${kind}: ${example}.`)
        continue
      }
      if (
        (kind === 'choice'
          ? !['string', 'number', 'choice'].includes(base(field.type).k)
          : base(field.type).k !== kind) ||
        (!optional && field.type.k === 'optional')
      )
        fail(
          attribute,
          `${name} of the ${what} is a ${kind}${optional ? ', or left out' : ''}: ${example}.`,
        )
      has[name] = field.type.k === 'optional' ? 'optional' : 'always'
    }
    return { expr: list, record, has }
  }

/**
 * A function of one item of the list another property holds, written in place:
 * (item) => item.locked. list names that property.
 */
export const perItem =
  (component, list, returns) =>
  ({ key, attribute, value, ctx, arrow, type, fail, T }) => {
    const items = type(list)
    if (items?.k !== 'array' || items.of.k !== 'record')
      fail(attribute, `${key} reads an item: give ${component} its ${list}.`)
    return { expr: arrow(value, [items.of], T[returns], ctx) }
  }

/** A literal number is checked while generating, as the Web checks it while rendering. */
export const bounded =
  (key, test, message) =>
  ({ value, ctx, expr, attribute, fail, T }) => {
    const number = expr(value, ctx, T.number)
    if (number.e === 'lit' && !test(number.value)) fail(attribute, `${key} ${message}`)
    return { expr: number }
  }

/** A field of a record in Swift, with what a record that leaves it out counts as. */
export const field = (has, name, fallback, item = '$0') =>
  !has[name]
    ? fallback
    : has[name] === 'optional'
      ? `${item}.${name} ?? ${fallback}`
      : `${item}.${name}`

/** String and Bool arguments a Swift helper takes by the property's own name. */
export const named = (props, emit, names) =>
  names.flatMap((name) => (props[name] ? [`${name}: ${emit.value(props[name])}`] : []))

/** The content of a slot as a SwiftUI closure body, or EmptyView when the source gave none. */
export function content(nodes, { emit, indent, tokens }, depth = 8) {
  const pad = ' '.repeat(indent + depth)
  return (
    nodes.map((child) => emit.view(child, indent + depth, tokens)).join('\n') || `${pad}EmptyView()`
  )
}

export const slotOf = (node, name) => node.slots?.find((each) => each.name === name)

/** Swift pieces the rows of several components are made of. */
export const listRuntime = {
  swiftRuntime: ({
    theme,
    metric,
    defaultMetric,
    motion,
  }) => `/// A row that is one button: the whole surface presses, through Jolt.
struct MavisRowButtonStyle: ButtonStyle {
    @Environment(\\.mavisTheme) private var mavisTheme
${defaultMetric('radius', 'radius.md')}
    @Environment(\\.isEnabled) private var isEnabled
    private var pressed: JoltPose { try! JoltPose(scale: ${metric('motion.pressScale')}) }
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .contentShape(RoundedRectangle(cornerRadius: radius))
            .opacity(isEnabled ? 1 : 0.45)
            .joltMotion(to: configuration.isPressed && isEnabled ? pressed : .identity, transition: ${motion('press(configuration.isPressed && isEnabled)', '.spring(.snappy)')})
    }
}

/// A header or a cell that is a button and keeps its own look: it only dims when disabled.
struct MavisPlainButtonStyle: ButtonStyle {
    @Environment(\\.mavisTheme) private var mavisTheme
    @Environment(\\.isEnabled) private var isEnabled
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.opacity(isEnabled ? 1 : 0.45)
    }
}`,
}
