import { bounded, formatter } from './chart-kit.mjs'
import { motionRuntime } from './motion.mjs'
import { swiftCall } from './choices.mjs'

export function motionToken({ value, ctx, expr, fail }) {
  const token = expr(value, ctx)
  if (!['string', 'number'].includes(token.type.k))
    fail(value, 'A replay token is a string or a number.')
  return { expr: token }
}
export const swiftMotionToken = (value, emit) =>
  `${JSON.stringify(value.expr.type.k + ':')} + ${value.expr.type.k === 'number' ? `mavisString(${emit.expr(value.expr)})` : emit.expr(value.expr)}`
const positive = bounded((n) => n > 0 && Number.isFinite(n), 'must be finite and positive.')
const nonnegative = bounded((n) => n >= 0 && Number.isFinite(n), 'must be finite and nonnegative.')
const named = (props, emit, names) =>
  names.flatMap((name) => (props[name] ? [`${name}: ${emit.value(props[name])}`] : []))

export const MAnimatedText = {
  props: {
    id: 'string',
    text: 'string',
    variant: 'string',
    tone: 'string',
    by: 'string',
    duration: positive,
    stagger: nonnegative,
    distance: 'number',
    animated: 'boolean',
    appear: 'boolean',
    replayKey: motionToken,
  },
  required: ['text'],
  uses: [motionRuntime],
  declaration: `declare function MAnimatedText(props: { id?: string; text: string; variant?: MavisVariant; tone?: MavisTone; by?: 'word' | 'letter'; duration?: number; stagger?: number; distance?: number; animated?: boolean; appear?: boolean; replayKey?: string | number }): JSX.Element`,
  swift(node, { emit, indent }) {
    const props = node.props
    return (
      swiftCall(
        'MavisAnimatedText',
        [
          ...named(props, emit, [
            'text',
            'variant',
            'tone',
            'by',
            'duration',
            'stagger',
            'distance',
            'animated',
            'appear',
          ]),
          ...(props.replayKey ? [`replayKey: ${swiftMotionToken(props.replayKey, emit)}`] : []),
        ],
        indent,
      ) + (props.id ? `\n${' '.repeat(indent + 4)}.mavisIdentifier(${emit.value(props.id)})` : '')
    )
  },
  swiftRuntime: () => `@MainActor private final class MavisTextEntranceModel: ObservableObject {
    @Published var entrance: JoltTextEntrance?
    func play(_ text: String, by: String, duration: Double, stagger: Double, distance: Double, animated: Bool, moving: Bool) {
        entrance?.dispose()
        entrance = nil
        guard animated, !text.isEmpty else { return }
        // These are Jolt's shared text-effect limits on every renderer, not a second animator.
        let options = try! JoltTextEntranceOptions(by: by == "word" ? .word : .letter, duration: duration, stagger: stagger, y: distance)
        entrance = try! JoltTextEntrance(text, options: options, reducedMotion: !moving)
    }
    func settle() { entrance?.cancel() }
}
struct MavisAnimatedText: View {
    let text: String
    var variant = "title"
    var tone = "text"
    var by = "word"
    var duration: Double = 650
    var stagger: Double = 35
    var distance: Double = 16
    var animated = true
    var appear = true
    var replayKey = "number:0"
    @StateObject private var model = MavisTextEntranceModel()
    @State private var mounted = false
    @State private var waitingAppearance = true
    private func play(_ moving: Bool) { model.play(text, by: by, duration: duration, stagger: stagger, distance: distance, animated: animated, moving: moving) }
    var body: some View {
        let _ = precondition(duration.isFinite && duration > 0 && stagger.isFinite && stagger >= 0 && distance.isFinite && ["word", "letter"].contains(by), "Invalid MAnimatedText options")
        MavisMotionReader { moving in
            Group {
                if let entrance = model.entrance { JoltAnimatedText(entrance) }
                else { Text(verbatim: text) }
            }
            .font(MavisTokens.font(variant))
            .foregroundStyle(MavisTokens.tone(tone))
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            .onAppear {
                if !mounted {
                    mounted = true
                    waitingAppearance = appear && !moving
                    if appear { play(moving) }
                }
            }
            .onChange(of: [text, by, replayKey, String(animated)]) { _, _ in play(moving) }
            .onChange(of: moving) { _, value in
                if value && waitingAppearance { waitingAppearance = false; play(true) }
                else if !value { model.settle() }
            }
            .onDisappear { model.settle() }
        }
    }
}`,
}

const formatFields = {
  style: "'decimal' | 'currency' | 'percent'",
  currency: 'string',
  currencyDisplay: "'symbol' | 'code'",
  useGrouping: 'boolean',
  minimumIntegerDigits: 'number',
  minimumFractionDigits: 'number',
  maximumFractionDigits: 'number',
}
export const MNumberFlow = {
  props: {
    id: 'string',
    value: 'number',
    locale: 'string',
    format: ({ value, ctx, expr, record }) => ({
      expr: expr(value, ctx, record('NumberFlowFormat')),
    }),
    formatValue: formatter,
    label: 'string',
    variant: 'string',
    tone: 'string',
    duration: positive,
    animated: 'boolean',
    announce: 'boolean',
  },
  required: ['value'],
  uses: [motionRuntime],
  records: { NumberFlowFormat: 'the portable decimal, percentage or currency format' },
  types: () =>
    `type NumberFlowFormat = { ${Object.entries(formatFields)
      .map(([name, type]) => `${name}?: ${type}`)
      .join('; ')} }`,
  declaration: `declare function MNumberFlow(props: { id?: string; value: number; locale?: string; format?: NumberFlowFormat; formatValue?: (value: number) => string; label?: string; variant?: MavisVariant; tone?: MavisTone; duration?: number; animated?: boolean; announce?: boolean }): JSX.Element`,
  swift(node, { emit, indent }) {
    const p = node.props
    const args = [...named(p, emit, ['value', 'locale'])]
    if (p.format)
      args.push(
        `options: { (format: NumberFlowFormat) in MavisNumberFormat(${Object.keys(formatFields)
          .map((name) => `${name}: format.${name}`)
          .join(', ')}) }(${emit.expr(p.format.expr)})`,
      )
    if (p.formatValue) args.push(`format: ${emit.closure(p.formatValue.expr, 'String')}`)
    args.push(...named(p, emit, ['label', 'variant', 'tone', 'duration', 'animated', 'announce']))
    return (
      swiftCall('MavisNumberFlow', args, indent) +
      (p.id ? `\n${' '.repeat(indent + 4)}.mavisIdentifier(${emit.value(p.id)})` : '')
    )
  },
  vue: { types: ['NumberFlowFormat'] },
  swiftRuntime: () => `struct MavisNumberFormat: Equatable {
    var style: String? = nil
    var currency: String? = nil
    var currencyDisplay: String? = nil
    var useGrouping: Bool? = nil
    var minimumIntegerDigits: Double? = nil
    var minimumFractionDigits: Double? = nil
    var maximumFractionDigits: Double? = nil
    func formatter(_ locale: String) -> NumberFormatter {
        let chosen = style ?? "decimal"
        precondition(["decimal", "currency", "percent"].contains(chosen), "Unknown number format style")
        precondition(currencyDisplay == nil || ["symbol", "code"].contains(currencyDisplay!), "Unknown currency display")
        if chosen == "currency" { precondition(currency?.range(of: "^[a-zA-Z]{3}$", options: .regularExpression) != nil, "Currency formatting requires a three-letter code") }
        for (value, low, high) in [(minimumIntegerDigits, 1.0, 21.0), (minimumFractionDigits, 0.0, 20.0), (maximumFractionDigits, 0.0, 20.0)] {
            if let value { precondition(value.isFinite && value.rounded() == value && value >= low && value <= high, "Invalid fraction digits") }
        }
        if let minimumFractionDigits, let maximumFractionDigits { precondition(minimumFractionDigits <= maximumFractionDigits, "Minimum fraction digits exceed maximum") }
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: locale)
        formatter.numberStyle = chosen == "currency" ? (currencyDisplay == "code" ? .currencyISOCode : .currency) : chosen == "percent" ? .percent : .decimal
        if let currency { formatter.currencyCode = currency.uppercased() }
        formatter.usesGroupingSeparator = useGrouping ?? true
        formatter.minimumIntegerDigits = Int(minimumIntegerDigits ?? 1)
        let defaults = chosen == "currency" ? max(0, formatter.maximumFractionDigits) : chosen == "percent" ? 0 : 3
        let minimum = minimumFractionDigits.map(Int.init) ?? min(chosen == "currency" ? defaults : 0, maximumFractionDigits.map(Int.init) ?? defaults)
        formatter.minimumFractionDigits = minimum
        formatter.maximumFractionDigits = maximumFractionDigits.map(Int.init) ?? max(minimum, defaults)
        formatter.roundingMode = .halfUp
        return formatter
    }
}
@MainActor private final class MavisNumberFormatBox {
    var format: (Double) -> String
    init(_ format: @escaping (Double) -> String) { self.format = format }
}
@MainActor private final class MavisNumberFlowModel: ObservableObject {
    @Published var number: JoltRollingNumber?
    private var duration: Double = 0
    private var previous: Double?
    private let formatter = MavisNumberFormatBox { mavisString($0) }
    func update(_ value: Double, duration: Double, animated: Bool, format: @escaping (Double) -> String) {
        formatter.format = format
        let start = number?.value ?? previous ?? value
        previous = value
        if !animated && (number == nil || format(value).count > 256 || duration > 60_000) {
            number?.dispose()
            number = nil
            return
        }
        if number == nil || self.duration != duration {
            number?.dispose()
            self.duration = duration
            let retained = formatter
            number = try! JoltRollingNumber(start, format: { retained.format($0) }, options: try! JoltRollOptions(duration: duration, stagger: 24))
        }
        if animated { try! number!.roll(to: value) } else { try! number!.set(value) }
    }
    func settle() { number?.cancel() }
}
struct MavisNumberFlow: View {
    let value: Double
    var locale = "en-US"
    var options = MavisNumberFormat()
    var format: ((Double) -> String)? = nil
    var label: String? = nil
    var variant = "title"
    var tone = "text"
    var duration: Double = 650
    var animated = true
    var announce = false
    @StateObject private var model = MavisNumberFlowModel()
    private var formatting: (Double) -> String {
        if let format { return format }
        let formatter = options.formatter(locale)
        return { formatter.string(from: NSNumber(value: $0)) ?? mavisString($0) }
    }
    var body: some View {
        let _ = precondition(value.isFinite && duration.isFinite && duration > 0, "MNumberFlow needs a finite value and positive duration")
        let format = formatting
        let text = format(value)
        MavisMotionReader { moving in
            Group {
                if let number = model.number { JoltRollingText(number, alignment: .leading) }
                else { Text(verbatim: text).monospacedDigit() }
            }
            .font(MavisTokens.font(variant))
            .foregroundStyle(MavisTokens.tone(tone))
            .lineLimit(1)
            .frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityLabel(Text(verbatim: label.map { $0 + ": " + text } ?? text))
            .onAppear { model.update(value, duration: duration, animated: false, format: format) }
            .onChange(of: [mavisString(value), text]) { _, _ in model.update(value, duration: duration, animated: animated && moving, format: format) }
            .onChange(of: animated && moving) { _, next in if !next { model.update(value, duration: duration, animated: false, format: format) } }
            .onDisappear { model.settle() }
        }
    }
}`,
}
