import { animatedFor } from '../tree.mjs'
import { expression, handlerJs } from '../js-text.mjs'
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
const alignments = ['start', 'center', 'end', 'stretch']
const justifications = ['start', 'center', 'end', 'between', 'around']

// rowContract and columnContract: the same properties; they differ in direction and in the
// default align (a column stretches its children, a row centers them).
const stack = (name, swiftView) => ({
  props: {
    ...boxProps,
    gap: 'space',
    justify: 'string',
    align: 'string',
    wrap: 'boolean',
    label: 'string',
    onKeyDown: 'key',
  },
  children: 'elements',
  animatesList: true,
  uses: [flexRuntime],
  declaration: `declare function ${name}(props: MavisStack): JSX.Element`,
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
      `spacing: ${spacing(props.gap, context, 'none')}`,
      ...(props.justify ? [`justify: ${choice(props.justify, 'MavisJustify', emit)}`] : []),
      ...(props.align ? [`align: ${choice(props.align, 'MavisAlign', emit)}`] : []),
      ...(props.wrap ? [`wrap: ${emit.value(props.wrap)}`] : []),
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
        return `tabindex="0" @keydown="${expression(`(event) => mavisKey(event, ${handlerJs(value)})`)}"`
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
type MavisStack = MavisBox & { gap?: MavisSpacing; justify?: MavisJustify; align?: MavisAlign; wrap?: boolean; label?: string; onKeyDown?: (key: MavisKey) => void; children?: unknown }`,
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
