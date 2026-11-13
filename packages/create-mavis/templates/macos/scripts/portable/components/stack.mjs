import { animatedFor } from '../tree.mjs'
import { expression, handlerJs } from '../js-text.mjs'
import { swiftNumber } from '../swift-text.mjs'
import { flexRuntime } from './flex.mjs'
import {
  accessibility,
  accessibleName,
  background,
  boxProps,
  choice,
  flexItem,
  padding,
  spacing,
  union,
} from './shared.mjs'

const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
const directions = ['row', 'column']
const alignments = ['start', 'center', 'end', 'stretch']
const justifications = ['start', 'center', 'end', 'between', 'around']

// stackProps' responsive: one breakpoint or a list of them, read while the screen is compiled
// because the Mac lays them out in SwiftUI. The same rules as stackLayout in the core: positive,
// distinct content widths, in ascending order whatever order the source writes.
function responsive({ key, value, fail, ts }) {
  const choices = { direction: directions, align: alignments, justify: justifications }
  const literal = (node) => {
    while (ts.isParenthesizedExpression(node) || ts.isAsExpression(node)) node = node.expression
    return node
  }
  const written = `On the Mac, ${key} is read when the screen is compiled: write the breakpoints here, as { at: 640, direction: 'row' } or a list of them.`
  const list = literal(value)
  const items = ts.isArrayLiteralExpression(list) ? list.elements : [list]
  const points = items.map((item) => {
    const object = literal(item)
    if (!ts.isObjectLiteralExpression(object)) fail(item, written)
    const point = {}
    for (const property of object.properties) {
      if (
        !ts.isPropertyAssignment(property) ||
        !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
      )
        fail(property, written)
      const name = property.name.text
      const given = literal(property.initializer)
      const number = () => {
        if (ts.isNumericLiteral(given)) return Number(given.text)
        if (
          ts.isPrefixUnaryExpression(given) &&
          given.operator === ts.SyntaxKind.MinusToken &&
          ts.isNumericLiteral(given.operand)
        )
          return -Number(given.operand.text)
        fail(property.initializer, written)
      }
      if (name === 'at') {
        point.at = number()
        if (!(point.at > 0) || !Number.isFinite(point.at))
          fail(property.initializer, 'A breakpoint is at a positive content width.')
      } else if (name === 'gap') {
        point.gap = ts.isStringLiteral(given) ? given.text : number()
        if (point.gap < 0) fail(property.initializer, 'gap cannot be negative.')
      } else if (name === 'wrap') {
        if (given.kind !== ts.SyntaxKind.TrueKeyword && given.kind !== ts.SyntaxKind.FalseKeyword)
          fail(property.initializer, written)
        point.wrap = given.kind === ts.SyntaxKind.TrueKeyword
      } else if (choices[name]) {
        if (!ts.isStringLiteral(given)) fail(property.initializer, written)
        if (!choices[name].includes(given.text))
          fail(
            property.initializer,
            `${name} is ${choices[name].slice(0, -1).join(', ')} or ${choices[name].at(-1)}.`,
          )
        point[name] = given.text
      } else fail(property, 'A breakpoint sets at, direction, gap, align, justify and wrap.')
    }
    if (point.at === undefined)
      fail(object, 'Each breakpoint needs at, the content width it starts at.')
    return { point, node: object }
  })
  const seen = new Set()
  for (const { point, node } of points) {
    if (seen.has(point.at))
      fail(node, `Two breakpoints are at ${point.at}; give each its own width.`)
    seen.add(point.at)
  }
  return { lit: points.map(({ point }) => point).sort((a, b) => a.at - b.at) }
}

// A breakpoint as the Mac's MavisBreakpoint.
export function swiftBreakpoint(point, tokens) {
  const args = [
    `at: ${swiftNumber(point.at)}`,
    ...(point.direction
      ? [`axis: ${point.direction === 'row' ? '.horizontal' : '.vertical'}`]
      : []),
    ...(point.gap !== undefined
      ? [
          `spacing: ${typeof point.gap === 'number' ? swiftNumber(point.gap) : tokens.space(point.gap)}`,
        ]
      : []),
    ...(point.align ? [`align: .${point.align}`] : []),
    ...(point.justify ? [`justify: .${point.justify}`] : []),
    ...(point.wrap !== undefined ? [`wrap: ${point.wrap}`] : []),
  ]
  return `MavisBreakpoint(${args.join(', ')})`
}

// The breakpoints as the Vue the Web and NativeScript run.
const vueBreakpoints = (points) =>
  `[${points
    .map(
      (point) =>
        `{ ${Object.entries(point)
          .map(([key, value]) => `${key}: ${typeof value === 'string' ? `'${value}'` : value}`)
          .join(', ')} }`,
    )
    .join(', ')}]`

// rowContract and columnContract: the same properties; they differ in direction and in the
// default align (a column stretches its children, a row centers them). stackProps adds a
// direction and responsive breakpoints to the column's.
const stack = (name, swiftView, own = {}) => ({
  props: {
    ...boxProps,
    gap: 'space',
    justify: 'string',
    align: 'string',
    wrap: 'boolean',
    label: 'string',
    onKeyDown: 'key',
    ...own,
  },
  children: 'elements',
  animatesList: true,
  uses: [flexRuntime],
  declaration: `declare function ${name}(props: MavisStack${name === 'MStack' ? ' & { direction?: MavisStackDirection; responsive?: MavisBreakpoint | readonly MavisBreakpoint[] }' : ''}): JSX.Element`,
  check(source) {
    const { props, tag, fail } = source
    const name = accessibleName(source)
    if (props.onKeyDown && !name)
      fail(tag, 'A stack that handles keys needs a label, so assistive technology can name it.')
  },
  focus: (node) => Boolean(node.props.onKeyDown),
  swift(node, context) {
    const { emit, indent, tokens } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const body = node.children
      .map((childNode) => emit.view(childNode, indent + 4, tokens))
      .join('\n')
    const args = [
      ...(props.direction
        ? [
            `axis: ${'lit' in props.direction ? (props.direction.lit === 'row' ? '.horizontal' : '.vertical') : `(${emit.expr(props.direction.expr)} == "row" ? .horizontal : .vertical)`}`,
          ]
        : []),
      `spacing: ${spacing(props.gap, context, 'none')}`,
      ...(props.justify ? [`justify: ${choice(props.justify, 'MavisJustify', emit)}`] : []),
      ...(props.align ? [`align: ${choice(props.align, 'MavisAlign', emit)}`] : []),
      ...(props.wrap ? [`wrap: ${emit.value(props.wrap)}`] : []),
      ...(props.responsive
        ? [
            `breakpoints: [${props.responsive.lit.map((point) => swiftBreakpoint(point, tokens)).join(', ')}]`,
          ]
        : []),
    ]
    const lines = [
      `${pad}${swiftView}(${args.join(', ')}) {`,
      body || `${pad}    EmptyView()`,
      `${pad}}`,
      ...padding(props, context),
      ...background(props, context),
    ]
    if (node.animatesList) {
      const list = animatedFor(node)
      const rows = list.key ? `${emit.wrap(list.each)}.map(\\.${list.key})` : emit.expr(list.each)
      lines.push(`${pad}    .joltLayout(value: ${rows})`)
    }
    lines.push(...accessibility(props, context, { container: true, name: props.label }))
    if (props.onKeyDown) {
      const key = emit.focusKey('stack')
      lines.push(
        // In the Tab order without keyboard navigation turned on, and focused by a click
        // anywhere in it, like the Web stack with tabindex="0".
        `${pad}    .contentShape(Rectangle())`,
        `${pad}    .focusable(interactions: .edit)`,
        `${pad}    .focused($mavisFocus, equals: ${key})`,
        `${pad}    .simultaneousGesture(TapGesture().onEnded { self.mavisFocus = ${key} })`,
        `${pad}    .onKeyPress(keys: [.upArrow, .downArrow, .leftArrow, .rightArrow]) { press in`,
        // Arrow keys also carry .function and .numericPad; only real modifiers opt out.
        `${pad}        guard press.modifiers.isDisjoint(with: [.command, .option, .control, .shift]) else { return .ignored }`,
        `${pad}        let handle: (String) -> Void = ${emit.handler(props.onKeyDown, indent + 8)}`,
        `${pad}        handle(mavisKeyName(press.key))`,
        `${pad}        return .handled`,
        `${pad}    }`,
      )
    }
    return [...lines, ...flexItem(props, context)].join('\n')
  },
  vue: {
    rename: { label: 'accessibilityLabel' },
    source: { hidden: ['label', 'onKeyDown'] },
    // Hardware keys only exist in the Web flavor.
    webOnly: ['onKeyDown'],
    attribute(name, value) {
      if (name === 'onKeyDown')
        return `tabindex="0" @keydown="${expression(`(event: KeyboardEvent) => mavisKey(event, ${handlerJs(value)})`)}"`
      if (name === 'responsive') return `:responsive="${expression(vueBreakpoints(value.lit))}"`
    },
    webAttributes: (node) =>
      node.props.label || node.props.accessibilityLabel ? ['role="group"'] : [],
    script: (nodes, { target }) =>
      target === 'web' && nodes.some((node) => node.props.onKeyDown)
        ? { runtime: ['mavisKey'] }
        : {},
  },
})

const column = stack('MColumn', 'MavisColumn')

export const MColumn = {
  ...column,
  reveals: true,
  types: () => `type MavisKey = ${union(keys)}
type MavisJustify = ${union(justifications)}
type MavisAlign = ${union(alignments)}
type MavisStack = MavisBox & { gap?: MavisSpacing; justify?: MavisJustify; align?: MavisAlign; wrap?: boolean; label?: string; onKeyDown?: (key: MavisKey) => void; children?: unknown }
type MavisStackDirection = ${union(directions)}
/** A content width from which a responsive MStack takes other values; the rest stay. */
type MavisBreakpoint = { at: number; direction?: MavisStackDirection; gap?: MavisSpacing; align?: MavisAlign; justify?: MavisJustify; wrap?: boolean }`,
  // The key helper both stacks call is written once.
  vue: {
    ...column.vue,
    runtime: {
      source: `export type MavisKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

const keys = new Set<string>(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])

/** Keys pressed while a stack or one of its rows has focus. Text editing keeps its own keys. */
export function mavisKey(event: KeyboardEvent, handle: (key: MavisKey) => void) {
  if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
  if (!keys.has(event.key)) return
  const target = event.target as Element | null
  if (target?.closest('input, textarea, select, [contenteditable]')) return
  event.preventDefault()
  handle(event.key as MavisKey)
}`,
    },
  },
}

export const MRow = stack('MRow', 'MavisRow')

// MStack is a column that can become a row: it reveals and animates lists like one.
const responsiveStack = stack('MStack', 'MavisStack', {
  direction: 'string',
  responsive,
})
export const MStack = {
  ...responsiveStack,
  reveals: true,
  vue: {
    ...responsiveStack.vue,
    source: {
      ...responsiveStack.vue.source,
      // A constant in the script would be a component member the Mac cannot read as a list.
      literals: {
        responsive:
          'On the Mac, responsive is read when the screen is compiled: write the breakpoints in the attribute, as :responsive="[{ at: 640, direction: \'row\' }]", not in the script.',
      },
    },
  },
  check(source) {
    responsiveStack.check(source)
    const { props, attrs, fail } = source
    if (props.direction && 'lit' in props.direction && !directions.includes(props.direction.lit))
      fail(attrs.get('direction'), 'direction is row or column.')
  },
}
