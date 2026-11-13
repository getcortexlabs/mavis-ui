import { choices, options } from './fields.mjs'
import { flexRuntime } from './flex.mjs'
import {
  choiceVue,
  control,
  controlProps,
  controlTypes,
  given,
  inputRuntime,
  layoutProps,
  layoutTypes,
} from './input-kit.mjs'

// radioGroupProps: one choice among options, each on its own row with a helper text of its own,
// under the group's label. The value belongs to the source and may be missing. A row asks for
// its value; a disabled one does not, and neither does the one already chosen.
export const MRadioGroup = {
  props: {
    ...controlProps,
    ...layoutProps,
    label: 'string',
    options,
    value: 'optional-string',
    onChange: 'string-handler',
    helperText: 'string',
    disabled: 'boolean',
  },
  required: ['label', 'options', 'value', 'onChange'],
  control: true,
  uses: [flexRuntime, inputRuntime],
  declaration: `declare function MRadioGroup(props: { label: string; options: readonly ChoiceOption[]; value: string | undefined; onChange: (value: string) => void; helperText?: string; disabled?: boolean; ${layoutTypes}; ${controlTypes} }): JSX.Element`,
  swift(node, context) {
    const { emit, indent } = context
    const props = node.props
    return [
      control(node, context, 'MavisRadioGroup', [
        ...given(node, context, ['label']),
        `options: ${choices(props.options, emit)}`,
        ...given(node, context, ['value', 'onChange', 'helperText', 'disabled']),
      ]),
      ...(props.id ? [`${' '.repeat(indent + 4)}.mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime({ theme, font, metric, motion }) {
    const body = theme.typography.body
    return `/// MRadioGroup: the group's label and helper text, then a row for each option: a ring with a
/// dot when it is chosen, the option's label and its helper text. The arrow keys choose the next
/// or the previous option that is not disabled; Jolt repaints the ring and shrinks it under a press.
struct MavisRadioGroup: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let options: [MavisChoice]
    let value: String?
    let onChange: (String) -> Void
    var helperText: String = ""
    var disabled: Bool = false
    @FocusState private var focus: String?

    /// canChoose in the Mavis core.
    private func choose(_ option: MavisChoice) {
        guard !disabled, !option.disabled, option.value != value else { return }
        onChange(option.value)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ${metric('space.sm')}) {
            Text(verbatim: label)
                .font(${font('body')}.weight(.semibold))
                .foregroundStyle(MavisTokens.text)
                .fixedSize(horizontal: false, vertical: true)
            if !helperText.isEmpty {
                Text(verbatim: helperText)
                    .font(${font('caption')})
                    .foregroundStyle(MavisTokens.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            ForEach(options, id: \\.value) { option in
                Toggle(isOn: Binding(get: { option.value == value }, set: { _ in choose(option) })) {
                    VStack(alignment: .leading, spacing: ${metric('space.xs')}) {
                        Text(verbatim: option.label)
                            .font(${font('body')}.weight(.semibold))
                            .foregroundStyle(MavisTokens.text)
                        if !option.helperText.isEmpty {
                            Text(verbatim: option.helperText)
                                .font(${font('caption')})
                                .foregroundStyle(MavisTokens.muted)
                        }
                    }
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .toggleStyle(MavisRadioStyle())
                .disabled(disabled || option.disabled)
                .opacity(disabled || option.disabled ? 0.45 : 1)
                .focused($focus, equals: option.value)
                .onKeyPress { press in
                    guard !disabled, let next = mavisChoiceTarget(options, from: option.value, press) else { return .ignored }
                    focus = next.value
                    choose(next)
                    return .handled
                }
                .accessibilityLabel(Text(verbatim: option.label))
                .accessibilityHint(Text(verbatim: option.helperText))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct MavisRadioStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        Button { configuration.isOn = true } label: { configuration.label }
            .buttonStyle(MavisRadioRow(on: configuration.isOn))
    }
}

private struct MavisRadioRow: ButtonStyle {
    @Environment(\\.mavisTheme) private var mavisTheme
    let on: Bool
    func makeBody(configuration: Configuration) -> some View {
        HStack(alignment: .center, spacing: ${metric('space.md')}) {
            ZStack {
                Circle().inset(by: 1).stroke(on ? MavisTokens.primary : MavisTokens.muted, lineWidth: 2)
                Circle().fill(MavisTokens.primary).frame(width: 12, height: 12).opacity(on ? 1 : 0)
            }
            .frame(width: 24, height: 24)
            .joltMotion(to: configuration.isPressed ? MavisChoiceMotion.pressed : .identity, transition: .spring(.snappy))
            .joltLayout(value: on, transition: ${motion('paint', 'MavisChoiceMotion.paint')})
            configuration.label
        }
        .padding(.vertical, ${metric('space.sm')})
        .padding(.horizontal, 2)
        .frame(minHeight: 48)
        .contentShape(Rectangle())
    }
}`
  },
  vue: choiceVue,
}
