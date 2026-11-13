import { named } from './feedback.mjs'
import { flexRuntime } from './flex.mjs'
import { accessibility, choice, flexItem, flexProps, union } from './shared.mjs'

const sizes = { sm: 4, md: 8, lg: 12 }
const tones = ['primary', 'accent', 'success', 'warning', 'danger']
// progressMotion in the Mavis core: the share of the track an indeterminate bar's segment covers.
const segment = 0.32

function max({ attribute, value, ctx, expr, fail, T }) {
  const number = expr(value, ctx, T.number)
  if (number.e === 'lit' && !(number.value > 0)) fail(attribute, 'max must be positive.')
  return { expr: number }
}

// progressProps: how far a task has come, as a bar of the tone's color on a track. value is
// kept from 0 to max; indeterminate shows a segment instead, for work without a known end.
export const MProgress = {
  props: {
    id: 'string',
    accessibilityHidden: 'boolean',
    ...flexProps,
    width: 'dimension',
    value: 'number',
    max,
    indeterminate: 'boolean',
    label: named('names the progress'),
    indeterminateLabel: named('is what assistive technology reads while the end is unknown'),
    size: 'string',
    tone: 'string',
  },
  required: ['label'],
  uses: [flexRuntime],
  types: () => `type MavisProgressTone = ${union(tones)}`,
  declaration: `declare function MProgress(props: MavisFlexItem & { id?: string; accessibilityHidden?: boolean; width?: MavisDimension; value?: number; max?: number; indeterminate?: boolean; label: string; indeterminateLabel?: string; size?: ${union(Object.keys(sizes))}; tone?: MavisProgressTone }): JSX.Element`,
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const args = [
      `label: ${emit.value(props.label)}`,
      ...['value', 'max', 'indeterminate', 'indeterminateLabel'].flatMap((key) =>
        props[key] ? [`${key}: ${emit.value(props[key])}`] : [],
      ),
      ...(props.size ? [`size: ${choice(props.size, 'MavisProgressSize', emit)}`] : []),
      ...(props.tone ? [`tone: ${choice(props.tone, 'MavisProgressTone', emit)}`] : []),
    ]
    return [
      `${pad}MavisProgress(${args.join(', ')})`,
      ...accessibility(props, context),
      ...flexItem(props, context),
    ].join('\n')
  },
  swiftRuntime: ({ theme, motion }) => `enum MavisProgressTone: String {
    case ${tones.join(', ')}
    init(_ name: String) { self = MavisProgressTone(rawValue: name) ?? .primary }
    var color: MavisColor { MavisTokens.tone(rawValue) }
}

enum MavisProgressSize: String {
    case ${Object.keys(sizes).join(', ')}
    init(_ name: String) { self = MavisProgressSize(rawValue: name) ?? .md }
    var thickness: Double {
        switch self {
${Object.entries(sizes)
  .map(([name, thickness]) => `        case .${name}: return ${thickness}`)
  .join('\n')}
        }
    }
}

/// MProgress: a bar of the tone's color on a track of the border color. The bar grows from the
/// leading edge to value's share of max, through Jolt; Reduce Motion puts it there at once. An
/// indeterminate bar shows a segment at rest in the middle of the track. Without a width the
/// track takes the width its stack offers and asks for none of its own, as on the Web.
struct MavisProgress: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    var value: Double = 0
    var max: Double = 100
    var indeterminate: Bool = false
    var indeterminateLabel: String = "Loading"
    var size: MavisProgressSize = .md
    var tone: MavisProgressTone = .primary
    // componentMotion's data transition in the Mavis core.
    private static let grow = try! JoltTransition.tween(milliseconds: ${theme.motion.enterDuration * 2.4}, ease: .${theme.motion.ease})

    /// progressState in the Mavis core: the share of max, from 0 to 1.
    private var ratio: Double {
        guard max.isFinite, max > 0, value.isFinite else { return 0 }
        return Swift.min(max, Swift.max(0, value)) / max
    }
    private var reading: String {
        indeterminate ? indeterminateLabel : mavisString((ratio * 1000).rounded() / 10) + "%"
    }

    var body: some View {
        Capsule()
            .fill(MavisTokens.border)
            .frame(idealWidth: 0, maxWidth: .infinity)
            .frame(height: size.thickness)
            .overlay(alignment: .leading) {
                GeometryReader { track in
                    if indeterminate {
                        Capsule()
                            .fill(tone.color)
                            .frame(width: track.size.width * ${segment})
                            .offset(x: track.size.width * ${Number(((1 - segment) / 2).toFixed(4))})
                    } else {
                        Capsule()
                            .fill(tone.color)
                            .scaleEffect(x: Swift.max(0.0001, ratio), y: 1, anchor: .leading)
                            .joltLayout(value: ratio, transition: ${motion('data', 'Self.grow')})
                    }
                }
            }
            .clipShape(Capsule())
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(Text(verbatim: label))
            .accessibilityValue(Text(verbatim: reading))
    }
}`,
}
