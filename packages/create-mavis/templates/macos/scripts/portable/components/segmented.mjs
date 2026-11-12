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

// segmentedProps: one choice among a few, side by side in segments of one width, named by label.
// The value belongs to the source and may be missing: then no segment is marked. A segment asks
// for its value; a disabled one does not, and neither does the one already chosen.
export const MSegmentedControl = {
  props: {
    ...controlProps,
    ...layoutProps,
    label: 'string',
    options,
    value: 'optional-string',
    onChange: 'string-handler',
    disabled: 'boolean',
  },
  required: ['label', 'options', 'value', 'onChange'],
  control: true,
  uses: [flexRuntime, inputRuntime],
  declaration: `declare function MSegmentedControl(props: { label: string; options: readonly SegmentedOption[]; value: string | undefined; onChange: (value: string) => void; disabled?: boolean; ${layoutTypes}; ${controlTypes} }): JSX.Element`,
  swift(node, context) {
    const { emit, indent } = context
    const props = node.props
    return [
      control(node, context, 'MavisSegmentedControl', [
        ...given(node, context, ['label']),
        `options: ${choices(props.options, emit)}`,
        ...given(node, context, ['value', 'onChange', 'disabled']),
      ]),
      ...(props.id ? [`${' '.repeat(indent + 4)}.mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime({ theme }) {
    const body = theme.typography.body
    const radius = theme.radius.md
    return `/// MSegmentedControl: segments of one width on the theme's elevated surface, and a marker
/// behind the chosen one. Jolt moves the marker, as segmentedMotion of the Mavis core times it;
/// the arrow keys choose the next or the previous segment, as radio buttons do.
struct MavisSegmentedControl: View {
    let label: String
    let options: [MavisChoice]
    let value: String?
    let onChange: (String) -> Void
    var disabled: Bool = false
    @FocusState private var focus: String?

    private static let slide: JoltTransition = try! .tween(milliseconds: 180, ease: .easeOut)

    /// canChoose in the Mavis core.
    private func choose(_ option: MavisChoice) {
        guard !disabled, !option.disabled, option.value != value else { return }
        onChange(option.value)
    }

    private var marker: some View {
        GeometryReader { proxy in
            let count = Double(Swift.max(1, options.count))
            let width: Double = Swift.max(0, (proxy.size.width - 4 * (count - 1)) / count)
            if let index = options.firstIndex(where: { $0.value == value }) {
                RoundedRectangle(cornerRadius: ${Math.max(0, radius - 4)})
                    .fill(MavisTokens.primarySoft)
                    .frame(width: width, height: proxy.size.height)
                    .offset(x: Double(index) * (width + 4))
                    .joltLayout(value: index, transition: Self.slide)
            }
        }
        .accessibilityHidden(true)
    }

    var body: some View {
        HStack(alignment: .center, spacing: 4) {
            ForEach(options, id: \\.value) { option in
                Toggle(isOn: Binding(get: { option.value == value }, set: { _ in choose(option) })) {
                    Text(verbatim: option.label)
                }
                .toggleStyle(MavisSegmentStyle())
                .disabled(disabled || option.disabled)
                .opacity(option.disabled && !disabled ? 0.45 : 1)
                .focused($focus, equals: option.value)
                .onKeyPress { press in
                    guard !disabled, let next = mavisChoiceTarget(options, from: option.value, press) else { return .ignored }
                    focus = next.value
                    choose(next)
                    return .handled
                }
                .accessibilityLabel(Text(verbatim: option.label))
                .accessibilityHint(Text(verbatim: label))
            }
        }
        .fixedSize(horizontal: false, vertical: true)
        .background { marker }
        // The Web's padding of 4 inside a border of 1.
        .padding(5)
        .background(MavisTokens.elevated, in: RoundedRectangle(cornerRadius: ${radius}))
        .overlay(RoundedRectangle(cornerRadius: ${radius}).strokeBorder(MavisTokens.border, lineWidth: 1).allowsHitTesting(false))
        .opacity(disabled ? 0.45 : 1)
        .frame(maxWidth: .infinity)
    }
}

private struct MavisSegmentStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        Button { configuration.isOn = true } label: { configuration.label }
            .buttonStyle(MavisSegment(on: configuration.isOn))
    }
}

private struct MavisSegment: ButtonStyle {
    let on: Bool
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: ${body.fontSize}, weight: .semibold))
            .multilineTextAlignment(.center)
            .foregroundStyle(on ? MavisTokens.primary : MavisTokens.text)
            .padding(.horizontal, 8)
            .padding(.vertical, 10)
            .frame(maxWidth: .infinity, minHeight: 48, maxHeight: .infinity)
            .contentShape(Rectangle())
    }
}`
  },
  vue: choiceVue,
}
