import { expression, handlerJs, js } from '../js-text.mjs'
import { swiftString } from '../swift-text.mjs'
import { reference } from './fields.mjs'
import { flexRuntime } from './flex.mjs'
import {
  bounded,
  control,
  controlProps,
  controlTypes,
  given,
  later,
  layoutProps,
  layoutTypes,
  number,
} from './input-kit.mjs'
import { union } from './shared.mjs'

const locales = ['en-US', 'pt-BR']

const validity = later(
  'validityChange hands its listener an object ({ status, value }), which an event of a shared screen cannot carry to the Mac yet (#349). Read the value and the draft instead: an empty or unfinished draft leaves the value as it was.',
)

const shared = (optional) =>
  `label: string; draft?: string; onDraftChange?: (draft: string) => void; min?: number; max?: number; step?: number; locale?: ${union(locales)}; name?: string; placeholder?: string; helperText?: string; error?: string; disabled?: boolean; readonly?: boolean; incrementLabel?: string; decrementLabel?: string; onFocus?: () => void; onBlur?: () => void; ${optional}${layoutTypes}; ${controlTypes}`

// numberInputProps: a number typed as text, with buttons that step it. The value belongs to the
// source and may be missing; what is being typed is the draft, kept while it is not a number yet
// ("-", "1."), so an unfinished draft asks for nothing and an empty one asks for no value. The
// draft can belong to the source too. name is for a Web form.
export const MNumberInput = {
  props: {
    ...controlProps,
    ...layoutProps,
    label: 'string',
    value: 'optional-number',
    onChange: 'optional-number-handler',
    draft: 'string',
    onDraftChange: 'string-handler',
    min: 'number',
    max: 'number',
    step: bounded('step', (value) => value > 0, 'must be positive.'),
    locale: 'string',
    name: 'string',
    placeholder: 'string',
    helperText: 'string',
    error: 'string',
    disabled: 'boolean',
    readonly: 'boolean',
    incrementLabel: 'string',
    decrementLabel: 'string',
    onFocus: 'handler',
    onBlur: 'handler',
    onValidityChange: validity,
    ref: reference,
  },
  required: ['label', 'value', 'onChange'],
  control: true,
  uses: [flexRuntime],
  declaration: `declare function MNumberInput(props: { value: number | undefined; onChange: (value: number | undefined) => void; ${shared('onValidityChange?: unknown; ref?: MavisFieldRef; ')} }): JSX.Element`,
  check({ props, attrs, fail }) {
    const min = number(props, 'min')
    const max = number(props, 'max')
    if (min !== undefined && max !== undefined && min > max)
      fail(attrs.get('min'), 'min does not exceed max.')
    if (props.locale && 'lit' in props.locale && !locales.includes(props.locale.lit))
      fail(attrs.get('locale'), `locale is ${locales.join(' or ')}.`)
    if (props.onDraftChange && !props.draft)
      fail(
        attrs.get('onDraftChange'),
        'The draft changes only when it belongs to the source: pass draft with it.',
      )
  },
  focus: () => true,
  swift(node, context) {
    const { emit } = context
    const ref = node.props.ref?.ref
    return control(node, context, 'MavisNumberInput', [
      ...given(node, context, ['label', 'value', 'onChange']),
      'focus: $mavisFocus',
      `focusKey: ${ref ? swiftString(ref) : emit.focusKey('number')}`,
      ...given(node, context, [
        'draft',
        'onDraftChange',
        ['min', 'minimum'],
        ['max', 'maximum'],
        'step',
        'locale',
        'placeholder',
        'helperText',
        'error',
        'disabled',
        'readonly',
        'incrementLabel',
        'decrementLabel',
        'onFocus',
        'onBlur',
        'id',
      ]),
    ])
  },
  swiftRuntime: ({
    theme,
    metric,
  }) => `/// What a draft of MNumberInput is, as parseNumberDraft in the Mavis core reads it.
enum MavisNumberDraft: Equatable {
    case valid(Double), empty, incomplete, invalid, range
}

/// formatNumber in the Mavis core: the digits of a number without an exponent, with the
/// locale's decimal mark.
func mavisFormatNumber(_ value: Double?, _ locale: String) -> String {
    guard let value, value.isFinite else { return "" }
    var text = mavisString(value)
    if let mark = text.firstIndex(of: "e") {
        let coefficient = String(text[..<mark]).replacingOccurrences(of: "-", with: "")
        let exponent = Int(text[text.index(after: mark)...].replacingOccurrences(of: "+", with: "")) ?? 0
        let parts = coefficient.split(separator: ".", maxSplits: 1, omittingEmptySubsequences: false)
        let whole = String(parts[0])
        let digits = whole + (parts.count > 1 ? String(parts[1]) : "")
        let point = whole.count + exponent
        let plain = point <= 0
            ? "0." + String(repeating: "0", count: -point) + digits
            : point >= digits.count
                ? digits + String(repeating: "0", count: point - digits.count)
                : String(digits.prefix(point)) + "." + String(digits.dropFirst(point))
        text = (value < 0 ? "-" : "") + plain
    }
    return locale == "pt-BR" ? text.replacingOccurrences(of: ".", with: ",") : text
}

/// parseNumberDraft in the Mavis core: a sign or a number that ends in its decimal mark is still
/// being typed; anything else that is not digits with one mark is not a number.
func mavisParseNumber(_ text: String, locale: String, minimum: Double?, maximum: Double?) -> MavisNumberDraft {
    let value = mavisTrim(text)
    if value.isEmpty { return .empty }
    var normalized = value
    if locale == "pt-BR", let comma = normalized.firstIndex(of: ",") {
        normalized.replaceSubrange(comma...comma, with: ".")
    }
    var body = Substring(normalized)
    let negative = body.first == "-"
    if body.first == "+" || body.first == "-" { body = body.dropFirst() }
    let parts = body.split(separator: ".", maxSplits: 1, omittingEmptySubsequences: false)
    let whole = parts.first ?? ""
    let fraction: Substring? = parts.count > 1 ? parts[1] : nil
    func digits(_ part: Substring) -> Bool { !part.isEmpty && part.allSatisfy { ("0"..."9").contains($0) } }
    if body.isEmpty || (fraction == "" && (whole.isEmpty || digits(whole))) { return .incomplete }
    guard (digits(whole) && fraction.map(digits) != false) || (whole.isEmpty && fraction.map(digits) == true) else { return .invalid }
    let plain = (negative ? "-" : "") + (whole.isEmpty ? "0" : whole) + (fraction.map { "." + $0 } ?? "")
    guard let number = Double(plain), number.isFinite else { return .invalid }
    if let minimum, number < minimum { return .range }
    if let maximum, number > maximum { return .range }
    return .valid(number)
}

/// stepNumber in the Mavis core: a step up or down in exact decimals while they fit a whole
/// number, kept inside the bounds. With no value it starts from zero, or from the bound nearest it.
func mavisStepNumber(_ value: Double?, _ direction: Double, step: Double, minimum: Double?, maximum: Double?) -> Double {
    let base = value ?? Swift.max(minimum ?? 0, Swift.min(0, maximum ?? 0))
    func decimals(_ number: Double) -> Int {
        let parts = mavisFormatNumber(number, "en-US").split(separator: ".", maxSplits: 1)
        return parts.count > 1 ? parts[1].count : 0
    }
    func safe(_ number: Double) -> Bool { number == number.rounded() && abs(number) <= 9_007_199_254_740_991 }
    let factor = pow(10, Double(Swift.max(decimals(base), decimals(step))))
    let scaledBase = mavisRound(base * factor)
    let scaledStep = mavisRound(step * factor)
    let scaledNext = scaledBase + direction * scaledStep
    let next = safe(scaledBase) && safe(scaledStep) && safe(scaledNext) ? scaledNext / factor : base + direction * step
    return Swift.max(minimum ?? -.infinity, Swift.min(maximum ?? .infinity, next.isFinite ? next : base))
}

/// MNumberInput: a field for the draft and two buttons that step the value. The value belongs
/// to the source: a draft that is a number in range asks for it, an empty draft asks for no
/// value, and one still being typed asks for nothing. A value the source keeps out puts its own
/// back in the field.
struct MavisNumberInput: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let value: Double?
    let onChange: (Double?) -> Void
    let focus: FocusState<String?>.Binding
    let focusKey: String
    var draft: String? = nil
    var onDraftChange: (String) -> Void = { _ in }
    var minimum: Double? = nil
    var maximum: Double? = nil
    var step: Double = 1
    var locale: String = "en-US"
    var placeholder: String = ""
    var helperText: String = ""
    var error: String = ""
    var disabled: Bool = false
    var readonly: Bool = false
    var incrementLabel: String = "Increase"
    var decrementLabel: String = "Decrease"
    var onFocus: () -> Void = {}
    var onBlur: () -> Void = {}
    var id: String = ""
    @State private var local: String?
    // What the field asked the source for, until the source answers.
    @State private var asked: Double??
    @State private var attempts = 0

    private struct Sync: Equatable {
        let value: Double?
        let locale: String
        let attempts: Int
    }

    private var shown: String { draft ?? local ?? mavisFormatNumber(value, locale) }
    private var parsed: MavisNumberDraft { mavisParseNumber(shown, locale: locale, minimum: minimum, maximum: maximum) }
    private var blocked: Bool { disabled || readonly }
    private var message: String {
        guard parsed == .invalid || parsed == .range else { return "" }
        return locale == "pt-BR" ? "Informe um número dentro dos limites." : "Enter a number within the allowed range."
    }

    private func setDraft(_ text: String) {
        local = text
        onDraftChange(text)
    }

    private func publish(_ next: Double?) {
        asked = .some(next)
        attempts += 1
        onChange(next)
    }

    private func edit(_ text: String) {
        guard !blocked else { return }
        setDraft(text)
        switch mavisParseNumber(text, locale: locale, minimum: minimum, maximum: maximum) {
        case .valid(let number): publish(number)
        case .empty: publish(nil)
        default: break
        }
    }

    private func move(_ direction: Double) {
        guard !blocked else { return }
        var current = value
        if case .valid(let number) = parsed { current = number }
        let next = mavisStepNumber(current, direction, step: step > 0 ? step : 1, minimum: minimum, maximum: maximum)
        setDraft(mavisFormatNumber(next, locale))
        publish(next)
    }

    private func stepper(_ sign: String, _ name: String, _ direction: Double, off: Bool) -> some View {
        Button { move(direction) } label: { Text(verbatim: sign) }
            .buttonStyle(MavisButtonStyle(variant: .secondary))
            .fixedSize()
            .disabled(blocked || off)
            .accessibilityLabel(Text(verbatim: name + ": " + label))
    }

    var body: some View {
        HStack(alignment: .bottom, spacing: ${metric('space.sm')}) {
            MavisTextInput(
                label: label,
                value: shown,
                onChange: edit,
                focus: focus,
                focusKey: focusKey,
                placeholder: placeholder,
                helperText: helperText,
                error: error.isEmpty ? message : error,
                disabled: disabled,
                readonly: readonly,
                id: id
            )
            .frame(maxWidth: .infinity)
            stepper("\\u{2212}", decrementLabel, -1, off: minimum != nil && value != nil && value! <= minimum!)
            stepper("+", incrementLabel, 1, off: maximum != nil && value != nil && value! >= maximum!)
        }
        .onKeyPress(keys: [.upArrow, .downArrow]) { press in
            guard !blocked, focus.wrappedValue == focusKey else { return .ignored }
            move(press.key == .upArrow ? 1 : -1)
            return .handled
        }
        .onChange(of: Sync(value: value, locale: locale, attempts: attempts)) { before, now in
            // What the field asked for and got leaves the draft as it was typed. Anything else
            // is the source's own value: one it set, or the one it kept when it refused another.
            if now.locale != before.locale || (asked == nil && now.value != before.value) || (asked != nil && asked! != now.value) {
                setDraft(mavisFormatNumber(now.value, now.locale))
            }
            asked = nil
        }
        .onChange(of: focus.wrappedValue == focusKey) { _, focused in
            if focused { onFocus() } else { onBlur() }
        }
    }
}`,
  vue: {
    rename: {
      value: 'modelValue',
      onChange: 'update:modelValue',
      onDraftChange: 'update:draft',
    },
    // The Web and NativeScript write null for no value; the source writes undefined.
    attribute(name, value) {
      if (name === 'value') return `:modelValue="${expression(`${js(value.expr)} ?? null`)}"`
      if (name === 'onChange' && value.params.some((param) => !param.unused))
        return `@update:modelValue="${expression(`(next) => (${handlerJs(value)})(next ?? undefined)`)}"`
    },
    source: {
      hidden: ['onValidityChange'],
      declaration: `(props: { value: number | null; onChange: (value: number | null) => void; ${shared('')} }) => JSX.Element`,
    },
  },
}
