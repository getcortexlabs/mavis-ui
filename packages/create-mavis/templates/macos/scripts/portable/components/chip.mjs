import { feedbackRuntime, named, textArgs } from './feedback.mjs'
import { flexRuntime } from './flex.mjs'
import { swiftGlyph } from './icon.mjs'
import { accessibility, choice, flexItem, flexProps, union } from './shared.mjs'

const tones = ['primary', 'accent']

// chipProps: a compact label with an optional icon. A selectable chip is a button that is on
// or off: selected and onChange are the contract's modelValue and its update, and a chip that is
// on shows a check in its tone's colors. A removable chip ends in a button named removeLabel
// that reports onRemove; the source decides what leaves. Like a badge it keeps its own width.
export const MChip = {
  props: {
    id: 'string',
    accessibilityHidden: 'boolean',
    ...flexProps,
    width: 'dimension',
    label: named('is what the chip says'),
    icon: 'string',
    tone: 'string',
    selectable: 'boolean',
    selected: 'boolean',
    onChange: 'boolean-handler',
    removable: 'boolean',
    removeLabel: named('names the remove button'),
    onRemove: 'handler',
    disabled: 'boolean',
  },
  required: ['label'],
  control: true,
  uses: [flexRuntime, feedbackRuntime],
  declaration: `declare function MChip(props: MavisFlexItem & { id?: string; accessibilityHidden?: boolean; width?: MavisDimension; label: string; icon?: MavisIconName; tone?: ${union(tones)}; selectable?: boolean; selected?: boolean; onChange?: (selected: boolean) => void; removable?: boolean; removeLabel?: string; onRemove?: () => void; disabled?: boolean }): JSX.Element`,
  check({ tag, props, attrs, fail }) {
    for (const key of ['selected', 'onChange'])
      if (props[key] && !props.selectable)
        fail(attrs.get(key), `${key} needs selectable: only a selectable chip is on or off.`)
    if (props.onRemove && !props.removable)
      fail(
        attrs.get('onRemove'),
        'onRemove needs removable: the remove button of the chip is what reports it.',
      )
    if (props.removable && !props.removeLabel)
      fail(
        attrs.get('removable') ?? tag,
        'A removable chip needs removeLabel: what its remove button is called, such as "Remove Design".',
      )
  },
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const sized =
      props.grow || (props.width && !('lit' in props.width && props.width.lit === 'auto'))
    const args = [
      ...textArgs(props, ['label'], emit),
      ...(props.icon
        ? [
            `glyph: ${'lit' in props.icon ? swiftGlyph(props.icon.lit) : `MavisIcons.glyph(${emit.expr(props.icon.expr)})`}`,
          ]
        : []),
      ...(props.tone ? [`tone: ${choice(props.tone, 'MavisChipTone', emit)}`] : []),
      ...textArgs(props, ['selectable', 'selected'], emit),
      ...(props.onChange ? [`onChange: ${emit.handler(props.onChange, indent)}`] : []),
      ...textArgs(props, ['removable', 'removeLabel'], emit),
      ...(props.onRemove ? [`onRemove: ${emit.handler(props.onRemove, indent)}`] : []),
      ...textArgs(props, ['disabled'], emit),
      ...(sized ? ['fill: true'] : []),
    ]
    const [item] = flexItem(props, context)
    return [
      `${pad}MavisChip(${args.join(', ')})`,
      ...accessibility(props, context, { container: true }),
      item ? item.replace(/\)$/, ', align: .start)') : `${pad}    .mavisItem(align: .start)`,
    ].join('\n')
  },
  swiftRuntime: ({ theme, metric, font, motion }) => `enum MavisChipTone: String {
    case ${tones.join(', ')}
    init(_ name: String) { self = MavisChipTone(rawValue: name) ?? .primary }
    var color: MavisColor { self == .primary ? MavisTokens.primary : MavisTokens.accent }
    var soft: MavisColor { self == .primary ? MavisTokens.primarySoft : MavisTokens.accentSoft }
}

/// MChip: a label, with its icon before it, in a pill with a border. A selectable chip is a
/// button that presses through Jolt; while it is on it shows a check in its tone's color on the
/// tone's soft color. A removable chip ends in a button of its own.
struct MavisChip: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    var glyph: String? = nil
    var tone: MavisChipTone = .primary
    var selectable: Bool = false
    var selected: Bool = false
    var onChange: (Bool) -> Void = { _ in }
    var removable: Bool = false
    var removeLabel: String = ""
    var onRemove: () -> Void = {}
    var disabled: Bool = false
    var fill: Bool = false

    private var on: Bool { selectable && selected }
    private var foreground: MavisColor { on ? tone.color : MavisTokens.text }

    private var content: some View {
        HStack(spacing: 6) {
            // A selectable chip keeps the place of its check while it is off.
            if glyph != nil || selectable {
                MavisIcon(glyph: on ? ${swiftGlyph('check')} : glyph ?? ${swiftGlyph('check')}, size: 16)
                    .foregroundStyle(on ? tone.color : MavisTokens.muted)
                    .opacity(on || glyph != nil ? 1 : 0)
            }
            Text(verbatim: label)
                .font(${font('caption')}.weight(.semibold))
                .foregroundStyle(foreground)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, minHeight: 46)
        .contentShape(Capsule())
    }

    var body: some View {
        MavisPillLayout(fill: fill) {
            HStack(spacing: 0) {
                if selectable {
                    Button(action: { onChange(!selected) }) { content }
                        .buttonStyle(MavisChipStyle())
                        .accessibilityLabel(Text(verbatim: label))
                        .accessibilityAddTraits(on ? .isSelected : [])
                } else {
                    content
                }
                if removable {
                    MavisGlyphButton(glyph: ${swiftGlyph('x')}, label: removeLabel, side: 46, tint: foreground, action: onRemove)
                }
            }
        }
        // The border takes one unit of the chip's box, as on the Web. It is the rim of a pill of
        // the border's color under the chip's own: a stroked capsule leaves marks at its ends.
        .padding(1)
        .background(Capsule().fill(on ? tone.soft : MavisTokens.surface).padding(1))
        .background(on ? tone.color : MavisTokens.border, in: Capsule())
        .compositingGroup()
        .opacity(disabled ? 0.45 : 1)
        .disabled(disabled)
    }
}

private struct MavisChipStyle: ButtonStyle {
    @Environment(\\.mavisTheme) private var mavisTheme
    @Environment(\\.isEnabled) private var isEnabled
    private var pressed: JoltPose { try! JoltPose(scale: ${metric('motion.pressScale')}) }
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .joltMotion(to: configuration.isPressed && isEnabled ? pressed : .identity, transition: ${motion('press(configuration.isPressed && isEnabled)', '.spring(.snappy)')})
    }
}`,
  vue: { rename: { selected: 'modelValue', onChange: 'update:modelValue' } },
}
