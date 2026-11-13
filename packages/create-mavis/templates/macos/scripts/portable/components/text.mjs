import { motionSurfaceReference, motionSurfaceRuntime } from './motion-surface.mjs'
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

const emphases = ['strong', 'em']

// What a run of text looks like: MText's text with what each MSpan around it sets. strong is
// bold unless a weight says otherwise, em is italic, and a nested span replaces weight and tone.
export function runs(parts, style = {}) {
  const out = []
  for (const part of parts) {
    if (part && part.v === 'span') {
      const next = { ...style }
      if (part.props.emphasis?.lit === 'strong') next.weight = { lit: 'bold' }
      if (part.props.emphasis?.lit === 'em') next.italic = true
      if (part.props.weight) next.weight = part.props.weight
      if (part.props.tone) next.tone = part.props.tone
      out.push(...runs(part.parts, next))
      continue
    }
    const last = out.at(-1)
    if (last && JSON.stringify(last.style) === JSON.stringify(style)) last.parts.push(part)
    else out.push({ style, parts: [part] })
  }
  return out
}

// The text as one SwiftUI Text: runs joined with +, so it reads as one continuous text.
function swiftText(parts, { emit, tokens }) {
  const pieces = runs(parts).map(({ style, parts: run }) => {
    const modifiers = [
      ...(style.weight
        ? [
            `.fontWeight(${'lit' in style.weight ? `.${tokens.weight(style.weight.lit)}` : `MavisTokens.weight(${emit.expr(style.weight.expr)})`})`,
          ]
        : []),
      ...(style.italic ? ['.italic()'] : []),
      ...(style.tone
        ? [
            `.foregroundStyle(${'lit' in style.tone ? tokens.color(style.tone.lit) : `MavisTokens.tone(${emit.expr(style.tone.expr)})`})`,
          ]
        : []),
    ]
    return `Text(verbatim: ${emit.interpolate(run)})${modifiers.join('')}`
  })
  return pieces.length === 1 ? pieces[0] : `(${pieces.join(' + ')})`
}

// spanProps: a run inside MText or another MSpan; MText turns the runs into one text.
export const MSpan = {
  props: {
    weight: 'string',
    tone: 'string',
    emphasis({ value, attribute, fail, ts }) {
      // It chooses <strong> or <em> on the Web, so it is fixed in the source.
      if (!ts.isStringLiteral(value) || !emphases.includes(value.text))
        fail(attribute, 'emphasis is written as a literal: strong or em.')
      return { lit: value.text }
    },
  },
  children: 'text',
  inline: true,
  declaration: `declare function MSpan(props: { text?: MavisText; weight?: MavisWeight; tone?: MavisTone; emphasis?: ${union(emphases)}; children?: MavisInline }): JSX.Element`,
}

// textContract. The text itself is the element's content: text, values and MSpan runs.
export const MText = {
  props: {
    motionSurface: motionSurfaceReference,
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
  uses: [motionSurfaceRuntime],
  types: () => `type MavisWeight = ${union(weights)}
/** What MText and MSpan contain: text, values and MSpan. */
type MavisInline = MavisText | JSX.Element | (MavisText | JSX.Element)[]`,
  declaration: `declare function MText(props: MavisView & MavisFlexItem & { motionSurface?: unknown; variant?: MavisVariant; tone?: MavisTone; weight?: MavisWeight; align?: ${union(Object.keys(alignments))}; as?: ${union(elements)}; wrap?: boolean; children?: MavisInline }): JSX.Element`,
  swift(node, context) {
    const { emit, indent, tokens } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const lines = [`${pad}${swiftText(node.parts, context)}`]
    const literal = !props.variant || 'lit' in props.variant
    const variant = literal ? (props.variant?.lit ?? 'body') : emit.expr(props.variant.expr)
    lines.push(
      tokens.scoped
        ? `${pad}    .mavisTypography(${literal ? JSON.stringify(variant) : variant})`
        : `${pad}    .font(${literal ? tokens.font(variant) : `MavisTokens.font(${variant})`})`,
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
      // The first level-one heading of a screen names its window.
      if (level === '1')
        lines.push(
          `${pad}    .mavisScreenTitle(${emit.interpolate(runs(node.parts).flatMap((run) => run.parts))})`,
        )
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
    return [
      ...lines,
      ...accessibility(props, context),
      ...flexItem(props, context),
      ...(props.motionSurface
        ? [`${pad}    .mavisMotionSurface(self.${props.motionSurface.ref})`]
        : []),
    ].join('\n')
  },
  vue: {
    attribute: (name, value) =>
      name === 'motionSurface' ? `:motionSurface="${value.ref}"` : undefined,
  },
  swiftRuntime: () => `/// MText align: where lines sit in the width the text is given.
enum MavisTextAlign: String {
    case left, center, right
    init(_ name: String) { self = MavisTextAlign(rawValue: name) ?? .left }
    var text: TextAlignment { self == .center ? .center : self == .right ? .trailing : .leading }
    var frame: Alignment { self == .center ? .center : self == .right ? .trailing : .leading }
}`,
}
