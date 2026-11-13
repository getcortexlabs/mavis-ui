import { feedbackRuntime, named, slotBody, slotViews, textArgs } from './feedback.mjs'
import { flexRuntime } from './flex.mjs'
import { swiftGlyph } from './icon.mjs'
import { accessibility, choice, flexItem, flexProps, union } from './shared.mjs'

// alertAppearance in the Mavis core: the icon and the theme color of each tone.
const appearance = {
  info: { icon: 'info', tone: 'accent' },
  success: { icon: 'circle-check', tone: 'success' },
  warning: { icon: 'triangle-alert', tone: 'warning' },
  error: { icon: 'circle-alert', tone: 'danger' },
}
const tones = Object.keys(appearance)

// alertProps: a message in place, with its tone's icon and border. onClose is the contract's
// close event, which the close button of a dismissible alert reports; the actions slot is a
// row under the message. announce asks assistive technology to read the message as it arrives.
export const MAlert = {
  props: {
    id: 'string',
    accessibilityHidden: 'boolean',
    ...flexProps,
    width: 'dimension',
    title: named('is the message'),
    description: 'string',
    tone: 'string',
    dismissible: 'boolean',
    closeLabel: named('names the close button'),
    announce: 'boolean',
    onClose: 'handler',
  },
  required: ['title'],
  slots: ['actions'],
  control: true,
  uses: [flexRuntime, feedbackRuntime],
  types: () => `type MavisAlertTone = ${union(tones)}`,
  declaration:
    'declare function MAlert(props: MavisFlexItem & { id?: string; accessibilityHidden?: boolean; width?: MavisDimension; title: string; description?: string; tone?: MavisAlertTone; dismissible?: boolean; closeLabel?: string; announce?: boolean; onClose?: () => void; slotActions?: JSX.Element }): JSX.Element',
  check({ props, attrs, fail }) {
    if (props.onClose && !props.dismissible)
      fail(
        attrs.get('onClose'),
        'onClose needs dismissible: the close button of the alert is what reports it.',
      )
  },
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const actions = slotBody(node, 'actions')
    const args = [
      ...textArgs(props, ['title', 'description'], emit),
      ...(props.tone ? [`tone: ${choice(props.tone, 'MavisAlertTone', emit)}`] : []),
      ...textArgs(props, ['dismissible', 'closeLabel'], emit),
      ...(props.onClose ? [`onClose: ${emit.handler(props.onClose, indent)}`] : []),
    ]
    // Labelled: as a trailing closure Swift would take the content for onClose.
    return [
      `${pad}MavisAlert(${args.join(', ')}${actions ? ', actions: {' : ')'}`,
      ...(actions ? [slotViews(actions, context), `${pad}})`] : []),
      ...accessibility(props, context, { container: true }),
      ...flexItem(props, context),
    ].join('\n')
  },
  swiftRuntime: ({ theme, font, metric }) => {
    const each = (text) =>
      tones.map((name) => `        case .${name}: return ${text(appearance[name])}`).join('\n')
    return `enum MavisAlertTone: String {
    case ${tones.join(', ')}
    init(_ name: String) { self = MavisAlertTone(rawValue: name) ?? .info }
    var color: MavisColor {
        switch self {
${each(({ tone }) => `MavisTokens.${tone}`)}
        }
    }
    var glyph: String {
        switch self {
${each(({ icon }) => swiftGlyph(icon))}
        }
    }
}

/// MAlert: a message on the theme's surface inside a border of its tone's color, with the
/// tone's icon before it. A dismissible alert ends in a close button; actions sit in a row
/// under the message and wrap.
struct MavisAlert<Actions: View>: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let title: String
    var description: String = ""
    var tone: MavisAlertTone = .info
    var dismissible: Bool = false
    var closeLabel: String = "Dismiss message"
    var onClose: () -> Void = {}
    @ViewBuilder var actions: () -> Actions

    var body: some View {
        MavisColumn(spacing: ${metric('space.md')}) {
            MavisRow(spacing: ${metric('space.sm')}, align: .start) {
                MavisIcon(glyph: tone.glyph, size: 20)
                    .foregroundStyle(tone.color)
                    .frame(width: 32, height: 32)
                    .background(MavisTokens.elevated, in: RoundedRectangle(cornerRadius: ${metric('radius.sm')}))
                    .mavisItem(shrink: 0)
                MavisColumn(spacing: ${metric('space.xs')}) {
                    Text(verbatim: title)
                        .font(${font('body')})
                        .fontWeight(.semibold)
                        .foregroundStyle(MavisTokens.text)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    if !description.isEmpty {
                        Text(verbatim: description)
                            .font(${font('body')})
                            .foregroundStyle(MavisTokens.muted)
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .mavisItem(grow: 1, width: .points(0))
                if dismissible {
                    MavisGlyphButton(glyph: ${swiftGlyph('x')}, label: closeLabel, action: onClose)
                        .mavisItem(shrink: 0)
                }
            }
            if Actions.self != EmptyView.self {
                MavisRow(spacing: ${metric('space.sm')}, align: .start, wrap: true) { actions() }
            }
        }
        // The border takes one unit of the alert's box, as on the Web.
        .padding(${metric('space.md', '+', 1)})
        .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${metric('radius.md')}))
        .overlay(RoundedRectangle(cornerRadius: ${metric('radius.md')}).strokeBorder(tone.color, lineWidth: 1).allowsHitTesting(false))
    }
}

extension MavisAlert where Actions == EmptyView {
    init(title: String, description: String = "", tone: MavisAlertTone = .info, dismissible: Bool = false, closeLabel: String = "Dismiss message", onClose: @escaping () -> Void = {}) {
        self.init(title: title, description: description, tone: tone, dismissible: dismissible, closeLabel: closeLabel, onClose: onClose, actions: { EmptyView() })
    }
}`
  },
}
