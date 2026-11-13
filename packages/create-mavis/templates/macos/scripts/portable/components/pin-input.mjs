import { swiftString } from '../swift-text.mjs'
import { reference } from './fields.mjs'
import { flexRuntime } from './flex.mjs'
import { bounded, control, given, inputRuntime } from './input-kit.mjs'

// pinInputProps: a short code of digits, one cell for each. The value belongs to the source;
// what is typed or pasted is kept to its digits (full-width ones too) up to length, and complete
// reports a code of the whole length. required, name and form are for a Web form.
export const MPinInput = {
  props: {
    id: 'string',
    label: 'string',
    value: 'string',
    onChange: 'string-handler',
    onComplete: 'string-handler',
    length: bounded(
      'length',
      (value) => Number.isInteger(value) && value >= 2 && value <= 12,
      'is a whole number from 2 to 12.',
    ),
    disabled: 'boolean',
    readonly: 'boolean',
    required: 'boolean',
    name: 'string',
    form: 'string',
    error: 'string',
    helperText: 'string',
    onFocus: 'handler',
    onBlur: 'handler',
    ref: reference,
  },
  required: ['label', 'value', 'onChange'],
  control: true,
  uses: [flexRuntime, inputRuntime],
  declaration:
    'declare function MPinInput(props: { id?: string; label: string; value: string; onChange: (value: string) => void; onComplete?: (value: string) => void; length?: number; disabled?: boolean; readonly?: boolean; required?: boolean; name?: string; form?: string; error?: string; helperText?: string; onFocus?: () => void; onBlur?: () => void; ref?: MavisFieldRef }): JSX.Element',
  focus: () => true,
  swift(node, context) {
    const { emit } = context
    const ref = node.props.ref?.ref
    return control(node, context, 'MavisPinInput', [
      ...given(node, context, ['label', 'value', 'onChange']),
      'focus: $mavisFocus',
      `focusKey: ${ref ? swiftString(ref) : emit.focusKey('pin')}`,
      ...given(node, context, [
        'onComplete',
        'length',
        'disabled',
        'readonly',
        'error',
        'helperText',
        'onFocus',
        'onBlur',
        'id',
      ]),
    ])
  },
  swiftRuntime({ theme, metric, font, motion }) {
    const body = theme.typography.body
    return `/// MPinInput: one editor over a row of cells that show its digits. The editor takes the
/// keyboard, the selection and what is pasted; the cells are decoration. The value belongs to the
/// source, and what is typed is kept to digits up to the length (normalizePin in the Mavis core).
struct MavisPinInput: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let value: String
    let onChange: (String) -> Void
    let focus: FocusState<String?>.Binding
    let focusKey: String
    var onComplete: (String) -> Void = { _ in }
    var length: Double = 6
    var disabled: Bool = false
    var readonly: Bool = false
    var error: String = ""
    var helperText: String = ""
    var onFocus: () -> Void = {}
    var onBlur: () -> Void = {}
    var id: String = ""
    @State private var draft: String
    // Codes sent to the source that have not come back yet. Typing can run ahead of them.
    @State private var pending: [String] = []

    init(
        label: String,
        value: String,
        onChange: @escaping (String) -> Void,
        focus: FocusState<String?>.Binding,
        focusKey: String,
        onComplete: @escaping (String) -> Void = { _ in },
        length: Double = 6,
        disabled: Bool = false,
        readonly: Bool = false,
        error: String = "",
        helperText: String = "",
        onFocus: @escaping () -> Void = {},
        onBlur: @escaping () -> Void = {},
        id: String = ""
    ) {
        self.label = label
        self.value = value
        self.onChange = onChange
        self.focus = focus
        self.focusKey = focusKey
        self.onComplete = onComplete
        self.length = length
        self.disabled = disabled
        self.readonly = readonly
        self.error = error
        self.helperText = helperText
        self.onFocus = onFocus
        self.onBlur = onBlur
        self.id = id
        _draft = State(initialValue: MavisPinInput.digits(of: value, length))
    }

    /// The Web refuses a length that is not a whole number from 2 to 12; the Mac keeps it there.
    private static func cells(_ length: Double) -> Int {
        length.isFinite ? Swift.min(12, Swift.max(2, Int(length))) : 6
    }

    private static func digits(of text: String, _ length: Double) -> String {
        var kept = ""
        for scalar in text.unicodeScalars where kept.count < cells(length) {
            switch scalar.value {
            case 0x30...0x39: kept.unicodeScalars.append(scalar)
            case 0xFF10...0xFF19: kept.unicodeScalars.append(Unicode.Scalar(scalar.value - 0xFEE0)!)
            default: break
            }
        }
        return kept
    }

    private var count: Int { Self.cells(length) }
    private var code: String { Self.digits(of: value, length) }
    private var focused: Bool { focus.wrappedValue == focusKey }
    private var message: String { error.isEmpty ? helperText : error }

    private func cell(_ index: Int) -> some View {
        let digit = index < code.count ? String(Array(code)[index]) : ""
        let active = focused && Swift.min(code.count, count - 1) == index
        return Text(verbatim: digit)
            .font(.system(size: 24, weight: .semibold).monospacedDigit())
            .foregroundStyle(MavisTokens.text)
            .frame(maxWidth: .infinity, minHeight: 52, maxHeight: 52)
            .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${metric('radius.md')}))
            .overlay(RoundedRectangle(cornerRadius: ${metric('radius.md')}).strokeBorder(!error.isEmpty ? MavisTokens.danger : active ? MavisTokens.primary : MavisTokens.border, lineWidth: 2).allowsHitTesting(false))
            .opacity(disabled ? 0.5 : 1)
            .joltMotion(to: (try? JoltPose(scale: active ? 1.04 : 1, opacity: digit.isEmpty ? 0.8 : 1)) ?? .identity, transition: ${motion('feedback', 'MavisChoiceMotion.feedback')})
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ${metric('space.sm')}) {
            Text(verbatim: label)
                .font(${font('body')}.weight(.semibold))
                .foregroundStyle(MavisTokens.text)
                .accessibilityHidden(true)
            HStack(spacing: ${metric('space.xs')}) {
                ForEach(0..<count, id: \\.self) { index in cell(index) }
            }
            .accessibilityHidden(true)
            .overlay {
                TextField(text: $draft) { Text(verbatim: label) }
                    .textFieldStyle(.plain)
                    .labelsHidden()
                    .font(.system(size: 24))
                    .autocorrectionDisabled()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .contentShape(Rectangle())
                    .opacity(0.02)
                    .focused(focus, equals: focusKey)
                    // A click on any cell goes to the editor, as on the Web.
                    .simultaneousGesture(TapGesture().onEnded { if !disabled { focus.wrappedValue = focusKey } })
                    .accessibilityLabel(Text(verbatim: label))
                    .accessibilityIdentifier(id)
            }
            .frame(maxWidth: Double(count) * 56, alignment: .leading)
            if !message.isEmpty {
                MavisFieldMessage(label: label, text: message, error: !error.isEmpty)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .disabled(disabled)
        .onChange(of: value) { _, _ in
            if let index = pending.firstIndex(of: code) {
                pending.removeFirst(index + 1)
            } else {
                // Changed by the source itself: show its code.
                pending = []
                if draft != code { draft = code }
            }
        }
        .onChange(of: draft) { _, typed in
            let next = readonly ? code : Self.digits(of: typed, length)
            if next != typed {
                draft = next
            } else if next != code && pending.last != next {
                pending.append(next)
                onChange(next)
                if next.count == count { onComplete(next) }
            }
        }
        .onChange(of: focused) { _, now in
            if now { onFocus() } else { onBlur() }
        }
    }
}`
  },
  vue: { rename: { value: 'modelValue', onChange: 'update:modelValue' } },
}
