// What the component modules share: the property groups of the Mavis contracts, their ambient
// types and the SwiftUI modifiers that draw them.
import { swiftNumber } from '../swift-text.mjs'

/** A TypeScript union of string literals, for the ambient declarations. */
export const union = (values) => values.map((value) => JSON.stringify(value)).join(' | ')

/** viewContract: what every primitive takes. */
export const viewProps = {
  id: 'string',
  accessibilityLabel: 'string',
  accessibilityHidden: 'boolean',
}
/** flexContract: how a child shares its MColumn or MRow. */
export const flexProps = { grow: 'factor', shrink: 'factor' }
/** boxContract: the box around a container's content. */
export const boxProps = {
  ...viewProps,
  ...flexProps,
  padding: 'space',
  paddingX: 'space',
  paddingY: 'space',
  radius: 'radius',
  width: 'dimension',
  height: 'dimension',
  backgroundColor: 'color',
}

/** Ambient types the declarations of several components use. */
export const sharedTypes = (theme) => `type MavisSpace = ${union(Object.keys(theme.space))}
/** A spacing token, or a number of layout units. */
type MavisSpacing = MavisSpace | number
type MavisRadius = ${union(Object.keys(theme.radius))} | number
/** A number of layout units, a share of the container such as "50%", or "auto". */
type MavisDimension = number | 'auto' | \`\${number}%\`
type MavisVariant = ${union(Object.keys(theme.typography))}
type MavisTone = ${union(Object.keys(theme.colors))}
type MavisText = string | number | boolean
type MavisView = { id?: string; accessibilityLabel?: string; accessibilityHidden?: boolean }
type MavisFlexItem = { grow?: number; shrink?: number }
type MavisBox = MavisView & MavisFlexItem & { padding?: MavisSpacing; paddingX?: MavisSpacing; paddingY?: MavisSpacing; radius?: MavisRadius; width?: MavisDimension; height?: MavisDimension; backgroundColor?: string }`

/** A name written once: the source's own label, or the contract's accessibilityLabel. */
export function accessibleName({ props, attrs, fail }) {
  if (props.label && props.accessibilityLabel)
    fail(
      attrs.get('accessibilityLabel'),
      'label and accessibilityLabel name the same thing; use one.',
    )
  return props.label ?? props.accessibilityLabel
}

const line = (indent, text) => `${' '.repeat(indent + 4)}${text}`

/** A choice written as a literal or computed: .center or MavisAlign(self.side). */
export const choice = (prop, type, emit) =>
  'lit' in prop ? `.${prop.lit}` : `${type}(${emit.expr(prop.expr)})`

/** A spacing property in points: its token, or the source's number. */
export const spacing = (prop, { emit, tokens }, fallback) =>
  prop && 'expr' in prop ? emit.expr(prop.expr) : tokens.space(prop, fallback)

/** A radius property in points. */
export const radius = (prop, { emit, tokens }) =>
  'expr' in prop ? emit.expr(prop.expr) : tokens.radius(prop.lit)

/** padding, with paddingX and paddingY each replacing its axis, as in the box contract. */
export function padding(props, context) {
  const { indent } = context
  const x = props.paddingX ?? props.padding
  const y = props.paddingY ?? props.padding
  if (!x && !y) return []
  if (x === y) return [line(indent, `.padding(${spacing(x, context)})`)]
  return [
    ...(x ? [line(indent, `.padding(.horizontal, ${spacing(x, context)})`)] : []),
    ...(y ? [line(indent, `.padding(.vertical, ${spacing(y, context)})`)] : []),
  ]
}

/** backgroundColor, rounded by radius. A radius alone draws nothing, as in CSS. */
export function background(props, context) {
  if (!props.backgroundColor) return []
  const shape = props.radius
    ? `, in: RoundedRectangle(cornerRadius: ${radius(props.radius, context)})`
    : ''
  const color = `mavisColor(${context.emit.value(props.backgroundColor)})`
  return [line(context.indent, `.background(${color}${shape})`)]
}

function dimension(prop, emit) {
  if ('expr' in prop) return `.points(${emit.expr(prop.expr)})`
  if (prop.lit === 'auto') return null
  return `.fraction(${swiftNumber(Number(prop.lit.slice(0, -1)) / 100)})`
}

/** grow, shrink, width and height: read by the enclosing MColumn or MRow. */
export function flexItem(props, { emit, indent }) {
  const args = [
    ...(props.grow ? [`grow: ${emit.expr(props.grow.expr)}`] : []),
    ...(props.shrink ? [`shrink: ${emit.expr(props.shrink.expr)}`] : []),
    ...['width', 'height'].flatMap((name) => {
      const value = props[name] && dimension(props[name], emit)
      return value ? [`${name}: ${value}`] : []
    }),
  ]
  return args.length ? [line(indent, `.mavisItem(${args.join(', ')})`)] : []
}

/**
 * id, the accessible name and accessibilityHidden. A named container becomes one element that
 * keeps its children. A container's id is only for test runs (see mavisIdentifier in flex.mjs);
 * texts, buttons and fields always carry theirs.
 */
export function accessibility(props, { emit, indent }, { container = false, name } = {}) {
  const label = name ?? props.accessibilityLabel
  const identifier = container ? 'mavisIdentifier' : 'accessibilityIdentifier'
  return [
    ...(container && label ? [line(indent, '.accessibilityElement(children: .contain)')] : []),
    ...(label ? [line(indent, `.accessibilityLabel(Text(verbatim: ${emit.value(label)}))`)] : []),
    ...(props.id ? [line(indent, `.${identifier}(${emit.value(props.id)})`)] : []),
    ...(props.accessibilityHidden
      ? [line(indent, `.accessibilityHidden(${emit.value(props.accessibilityHidden)})`)]
      : []),
  ]
}
