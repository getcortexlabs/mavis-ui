import { flexRuntime } from './flex.mjs'
import {
  control,
  controlProps,
  controlTypes,
  given,
  inputRuntime,
  layoutProps,
  layoutTypes,
} from './input-kit.mjs'

// switchProps: one setting that is on or off, named by its label. The value belongs to the
// source: the switch asks for the other one, and a value the source keeps out leaves it where
// it was. The whole row is the control, as on the Web.
export const MSwitch = {
  props: {
    ...controlProps,
    ...layoutProps,
    label: 'string',
    checked: 'boolean',
    onChange: 'boolean-handler',
    helperText: 'string',
    disabled: 'boolean',
  },
  required: ['label', 'checked', 'onChange'],
  control: true,
  uses: [flexRuntime, inputRuntime],
  declaration: `declare function MSwitch(props: { label: string; checked: boolean; onChange: (checked: boolean) => void; helperText?: string; disabled?: boolean; ${layoutTypes}; ${controlTypes} }): JSX.Element`,
  swift: (node, context) =>
    control(
      node,
      context,
      'MavisSwitch',
      given(node, context, ['label', 'checked', 'onChange', 'helperText', 'disabled', 'id']),
    ),
  swiftRuntime({ theme, font, metric, motion }) {
    const body = theme.typography.body
    return `/// MSwitch: the label and its helper text beside a track with a thumb, one control from edge
/// to edge. Jolt moves the thumb and repaints the track; a press shrinks the thumb.
struct MavisSwitch: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let checked: Bool
    let onChange: (Bool) -> Void
    var helperText: String = ""
    var disabled: Bool = false
    var id: String = ""

    var body: some View {
        Toggle(isOn: Binding(get: { checked }, set: { next in if next != checked { onChange(next) } })) {
            VStack(alignment: .leading, spacing: ${metric('space.xs')}) {
                Text(verbatim: label)
                    .font(${font('body')}.weight(.semibold))
                    .foregroundStyle(MavisTokens.text)
                if !helperText.isEmpty {
                    Text(verbatim: helperText)
                        .font(${font('caption')})
                        .foregroundStyle(MavisTokens.muted)
                }
            }
            .multilineTextAlignment(.leading)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .toggleStyle(MavisSwitchStyle())
        .disabled(disabled)
        .opacity(disabled ? 0.45 : 1)
        .accessibilityLabel(Text(verbatim: label))
        .accessibilityHint(Text(verbatim: helperText))
        .accessibilityIdentifier(id)
    }
}

private struct MavisSwitchStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        Button { configuration.isOn.toggle() } label: { configuration.label }
            .buttonStyle(MavisSwitchRow(on: configuration.isOn))
    }
}

private struct MavisSwitchRow: ButtonStyle {
    @Environment(\\.mavisTheme) private var mavisTheme
    let on: Bool
    func makeBody(configuration: Configuration) -> some View {
        HStack(alignment: .center, spacing: ${metric('space.md')}) {
            configuration.label
            ZStack(alignment: on ? .trailing : .leading) {
                Capsule().fill(on ? MavisTokens.primary : MavisTokens.muted)
                Circle()
                    .fill(on ? MavisTokens.onPrimary : MavisTokens.surface)
                    .shadow(color: .black.opacity(0.2), radius: 1.5, y: 1)
                    .frame(width: 24, height: 24)
                    .joltMotion(to: configuration.isPressed ? MavisChoiceMotion.pressed : .identity, transition: .spring(.snappy))
                    .padding(4)
            }
            .frame(width: 52, height: 32)
            .joltLayout(value: on, transition: ${motion('paint', 'MavisChoiceMotion.paint')})
        }
        .padding(.vertical, ${metric('space.sm')})
        .frame(minHeight: 48)
        .contentShape(Rectangle())
    }
}`
  },
  vue: { rename: { checked: 'modelValue', onChange: 'update:modelValue' } },
}
