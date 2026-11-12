import { swiftString } from '../swift-text.mjs'
import { feedbackRuntime } from './feedback.mjs'
import { accessibility, choice, union, viewProps } from './shared.mjs'

const tones = ['neutral', 'primary', 'accent', 'success', 'warning', 'danger']
const sizes = ['sm', 'md']
// The Web badge: its font size, its padding and its smallest width, by size.
const look = {
  sm: { fontSize: 11, paddingX: 8, paddingY: 3, minWidth: 22 },
  md: { fontSize: 13, paddingX: 10, paddingY: 5, minWidth: 28 },
}
const lineHeight = 1.4

// A label or a count: text as it is, a number as JavaScript writes it.
function text({ key, attribute, value, ctx, expr, fail, ts }) {
  if (ts.isStringLiteral(value)) return { lit: value.text }
  const shown = expr(value, ctx)
  if (!['string', 'number'].includes(shown.type.k))
    fail(attribute, `${key} takes text or a number.`)
  return { expr: shown }
}

/** A property that is text or a number, as the text the Mac shows. */
export const shownText = (prop, emit) =>
  'lit' in prop ? swiftString(prop.lit) : emit.text(prop.expr)

// badgeProps: a short label or count on a soft pill, as wide as its text. It keeps its own
// size in a stack: a column does not stretch it, and a row puts it at its top.
export const MBadge = {
  props: { ...viewProps, text, size: 'string', tone: 'string' },
  required: ['text'],
  uses: [feedbackRuntime],
  types: () => `type MavisBadgeTone = ${union(tones)}`,
  declaration: `declare function MBadge(props: MavisView & { text: string | number; size?: ${union(sizes)}; tone?: MavisBadgeTone }): JSX.Element`,
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const args = [
      `text: ${shownText(props.text, emit)}`,
      ...(props.size ? [`size: ${choice(props.size, 'MavisBadgeSize', emit)}`] : []),
      ...(props.tone ? [`tone: ${choice(props.tone, 'MavisBadgeTone', emit)}`] : []),
    ]
    return [
      `${pad}MavisBadge(${args.join(', ')})`,
      ...accessibility(props, context),
      `${pad}    .mavisItem(align: .start)`,
    ].join('\n')
  },
  swiftRuntime: () => {
    const each = (text) => sizes.map((name) => `        case .${name}: return ${text(look[name])}`)
    return `enum MavisBadgeTone: String {
    case ${tones.join(', ')}
    init(_ name: String) { self = MavisBadgeTone(rawValue: name) ?? .neutral }
    var foreground: MavisColor {
        switch self {
        case .neutral: return MavisTokens.text
        case .primary: return MavisTokens.primary
        case .accent: return MavisTokens.accent
        case .success: return MavisTokens.success
        case .warning: return MavisTokens.warning
        case .danger: return MavisTokens.danger
        }
    }
    var background: MavisColor {
        self == .primary ? MavisTokens.primarySoft : self == .accent ? MavisTokens.accentSoft : MavisTokens.elevated
    }
}

enum MavisBadgeSize: String {
    case ${sizes.join(', ')}
    init(_ name: String) { self = MavisBadgeSize(rawValue: name) ?? .md }
    var fontSize: Double {
        switch self {
${each((size) => size.fontSize).join('\n')}
        }
    }
    var paddingX: Double {
        switch self {
${each((size) => size.paddingX).join('\n')}
        }
    }
    var paddingY: Double {
        switch self {
${each((size) => size.paddingY).join('\n')}
        }
    }
    var minWidth: Double {
        switch self {
${each((size) => size.minWidth).join('\n')}
        }
    }
}

/// MBadge: a label or a count in its tone's color on a soft pill, as wide as its text.
struct MavisBadge: View {
    let text: String
    var size: MavisBadgeSize = .md
    var tone: MavisBadgeTone = .neutral

    var body: some View {
        MavisFitted {
            Text(verbatim: text)
                .font(.system(size: size.fontSize, weight: .semibold))
                .multilineTextAlignment(.center)
                .foregroundStyle(tone.foreground)
                .fixedSize(horizontal: false, vertical: true)
                .frame(minHeight: size.fontSize * ${lineHeight})
                .padding(.horizontal, size.paddingX)
                .padding(.vertical, size.paddingY)
        }
        .frame(minWidth: size.minWidth)
        .background(tone.background, in: Capsule())
        // One element as large as the pill: its frame is the badge's, not the text's.
        .accessibilityElement(children: .combine)
    }
}`
  },
}
