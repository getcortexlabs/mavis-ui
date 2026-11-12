import { accessibility, flexItem, flexProps, union, viewProps } from './shared.mjs'

const elements = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
const weights = ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900']
const alignments = { left: 'leading', center: 'center', right: 'trailing' }

function element({ value, attribute, fail, ts }) {
  // The Web renders this element, so it cannot change while the screen runs.
  if (!ts.isStringLiteral(value))
    fail(attribute, 'as is written as a literal, for example as="h2".')
  return { lit: value.text }
}

// textContract. The text itself is the element's content.
export const MText = {
  props: {
    ...viewProps,
    ...flexProps,
    variant: 'string',
    tone: 'string',
    weight: 'string',
    align: 'string',
    as: element,
    wrap: 'boolean',
  },
  children: 'text',
  types: () => `type MavisWeight = ${union(weights)}`,
  declaration: `declare function MText(props: MavisView & MavisFlexItem & { variant?: MavisVariant; tone?: MavisTone; weight?: MavisWeight; align?: ${union(Object.keys(alignments))}; as?: ${union(elements)}; wrap?: boolean; children?: MavisText | MavisText[] }): JSX.Element`,
  swift(node, context) {
    const { emit, indent, tokens } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const lines = [`${pad}Text(verbatim: ${emit.interpolate(node.parts)})`]
    const literal = !props.variant || 'lit' in props.variant
    const variant = literal ? (props.variant?.lit ?? 'body') : emit.expr(props.variant.expr)
    lines.push(
      `${pad}    .font(${literal ? tokens.font(variant) : `MavisTokens.font(${variant})`})`,
    )
    if (props.weight)
      lines.push(
        `${pad}    .fontWeight(${'lit' in props.weight ? `.${tokens.weight(props.weight.lit)}` : `MavisTokens.weight(${emit.expr(props.weight.expr)})`})`,
      )
    lines.push(
      !props.tone || 'lit' in props.tone
        ? `${pad}    .foregroundStyle(${tokens.color(props.tone?.lit ?? 'text')})`
        : `${pad}    .foregroundStyle(MavisTokens.tone(${emit.expr(props.tone.expr)}))`,
    )
    const align =
      props.align &&
      ('lit' in props.align
        ? `MavisTextAlign.${props.align.lit}`
        : `MavisTextAlign(${emit.expr(props.align.expr)})`)
    if (props.align) lines.push(`${pad}    .multilineTextAlignment(${align}.text)`)
    if (props.wrap)
      lines.push(
        `${pad}    .lineLimit(${props.wrap.expr.e === 'lit' ? (props.wrap.expr.value ? 'nil' : '1') : `${emit.expr(props.wrap.expr)} ? nil : 1`})`,
      )
    lines.push(
      `${pad}    .fixedSize(horizontal: false, vertical: true)`,
      // The text takes the width its stack gives it, as a block of text does on the Web.
      `${pad}    .frame(maxWidth: .infinity, alignment: ${props.align ? `${align}.frame` : '.leading'})`,
    )
    // as decides what assistive technology hears; without it the large variants are headings.
    if (props.as) {
      const level = /^h([1-6])$/.exec(props.as.lit)?.[1]
      if (level)
        lines.push(
          `${pad}    .accessibilityAddTraits(.isHeader)`,
          `${pad}    .accessibilityHeading(.h${level})`,
        )
    } else if (!literal)
      lines.push(
        `${pad}    .accessibilityAddTraits(MavisTokens.isHeading(${variant}) ? .isHeader : [])`,
      )
    else if (['title', 'heading', 'display'].includes(variant))
      lines.push(`${pad}    .accessibilityAddTraits(.isHeader)`)
    return [...lines, ...accessibility(props, context), ...flexItem(props, context)].join('\n')
  },
  swiftRuntime: () => `/// MText align: where lines sit in the width the text is given.
enum MavisTextAlign: String {
    case left, center, right
    init(_ name: String) { self = MavisTextAlign(rawValue: name) ?? .left }
    var text: TextAlignment { self == .center ? .center : self == .right ? .trailing : .leading }
    var frame: Alignment { self == .center ? .center : self == .right ? .trailing : .leading }
}`,
}
