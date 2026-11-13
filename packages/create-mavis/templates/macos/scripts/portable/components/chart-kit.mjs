// What the chart components share: how a source's data and formatters are read, and the Swift
// every chart draws with. The geometry is the Mavis core's, ported function by function in
// chartGeometry below; test/create-mavis-charts.spec.ts runs the ports against the core.
import { js, wrap } from '../js-text.mjs'

/** A number that is checked while generating when it is a literal, as the Web checks it while rendering. */
export const bounded =
  (test, message) =>
  ({ key, value, ctx, expr, attribute, fail, T }) => {
    const number = expr(value, ctx, T.number)
    if (number.e === 'lit' && !test(number.value)) fail(attribute, `${key} ${message}`)
    return { expr: number }
  }

/**
 * formatValue: the text a value becomes, written where it is used. A function of the component
 * that returns a value is not part of the model yet.
 */
export function formatter({ key, value, attribute, ctx, arrow, fail, T, ts }) {
  if (!ts.isArrowFunction(value) || value.parameters.length !== 1 || ts.isBlock(value.body))
    fail(
      attribute,
      `${key} is written in place, as an arrow from the value to its text: (value) => \`\${value} ms\`. A function of the component that returns a value does not reach the Mac yet (#340).`,
    )
  return { expr: arrow(value, [T.number], T.string, ctx) }
}

/** domain: the two ends of the value axis, written in place so both targets read the same pair. */
export function domain({ key, value, attribute, ctx, expr, fail, T, ts }) {
  if (
    !ts.isArrayLiteralExpression(value) ||
    value.elements.length !== 2 ||
    value.elements.some(ts.isSpreadElement)
  )
    fail(attribute, `${key} is written in place as [lowest, highest], such as [0, 100].`)
  const items = value.elements.map((element) => expr(element, ctx, T.number))
  if (items.every((item) => item.e === 'lit') && !(items[0].value < items[1].value))
    fail(attribute, `${key} needs two increasing values.`)
  return { expr: { e: 'array', items, type: T.array(T.number) } }
}

/**
 * A list of records a chart reads fields of: the contract's own type, or any record of the
 * source with the same fields. The property keeps which of the fields the record has, and which
 * can be missing.
 */
export const records =
  (component, example, wanted) =>
  ({ attribute, value, ctx, expr, fail, fields }) => {
    const list = expr(value, ctx)
    const record = list.type.k === 'array' && list.type.of.k === 'record' ? list.type.of.name : null
    if (!record) fail(attribute, `${component} takes a list of records, such as ${example}.`)
    const own = new Map(fields(record).map((field) => [field.name, field.type]))
    const found = {}
    for (const [name, kind, required = true] of wanted) {
      const type = own.get(name)
      if (!type) {
        if (required) fail(attribute, `Every record of ${component} needs ${name}.`)
        continue
      }
      const inner = type.k === 'optional' ? type.of : type
      const matches =
        kind === 'numbers'
          ? inner.k === 'array' &&
            (inner.of.k === 'optional' ? inner.of.of : inner.of).k === 'number'
          : inner.k === kind
      if (!matches) fail(attribute, `${name} of a ${component} record is ${describe(kind)}.`)
      found[name] = {
        optional: type.k === 'optional',
        ...(kind === 'numbers' ? { gaps: inner.of.k === 'optional' } : {}),
      }
    }
    return { expr: list, record, fields: found }
  }

const describe = (kind) =>
  ({ string: 'text', number: 'a number', boolean: 'true or false', numbers: 'a list of numbers' })[
    kind
  ]

/** The records as the Swift type a chart draws from: labels by field, nil for a field the record lacks. */
export const swiftRecords = (prop, emit, type, map) =>
  `${emit.wrap(prop.expr)}.map { ${type}(${map
    .map(([label, field]) => `${label}: ${prop.fields[field] ? `$0.${field}` : 'nil'}`)
    .join(', ')}) }`

/**
 * The records as Mavis on the Web and NativeScript takes them: a missing value is null there,
 * and undefined in the generated Vue.
 */
export const nulled = (prop, field = 'value') =>
  prop.fields[field]?.optional
    ? `${wrap(prop.expr)}.map((entry) => ({ ...entry, ${field}: entry.${field} ?? null }))`
    : js(prop.expr)

/** A hex color of the source, or the token the theme gives when it is left out. */
export const swiftColor = (prop, emit) => (prop ? `mavisHexColor(${emit.value(prop)})` : 'nil')

/** The geometry of the Mavis core that every chart shares, in Swift without any view. */
export const chartGeometry = `/// One value of a chart on the Mac, whatever record the source keeps it in.
struct MavisChartPoint: Hashable {
    let id: String
    let label: String
    let value: Double?
}

/// The value axis chartGeometry in the Mavis core settles on: zero and every value, or the
/// domain given; where zero sits on it and its five ticks. y is a value's place from the top.
struct MavisChartScale: Equatable {
    let min: Double
    let max: Double
    let zero: Double
    let ticks: [Double]

    func y(_ value: Double) -> Double { 1 - (value - min) / (max - min) }
}

/// Nil where chartGeometry throws: a value that is not finite, a domain that is not two
/// increasing numbers or leaves a value out.
func mavisChartScale(_ values: [Double?], domain: [Double]?) -> MavisChartScale? {
    let known = values.compactMap { $0 }
    guard known.allSatisfy({ $0.isFinite }) else { return nil }
    var low = known.reduce(0.0) { Swift.min($0, $1) }
    var high = known.reduce(0.0) { Swift.max($0, $1) }
    if let domain {
        guard domain.count == 2, domain[0].isFinite, domain[1].isFinite, domain[0] < domain[1] else { return nil }
        low = domain[0]
        high = domain[1]
        guard known.allSatisfy({ $0 >= low && $0 <= high }) else { return nil }
    } else if low == high {
        high = low + 1
    }
    let span = high - low
    guard span.isFinite else { return nil }
    let zero = 1 - (Swift.max(low, Swift.min(high, 0)) - low) / span
    return MavisChartScale(min: low, max: high, zero: zero, ticks: (0..<5).map { low + span * (Double($0) / 4) })
}

/// Keys the Mavis core accepts: none empty, none twice.
func mavisDistinct(_ keys: [String]) -> Bool {
    !keys.contains("") && Set(keys).count == keys.count
}

/// A six-digit hex color, as the chart contracts ask for.
func mavisIsHex(_ color: String) -> Bool {
    let digits = color.dropFirst()
    return color.hasPrefix("#") && digits.count == 6 && digits.allSatisfy({ $0.isASCII && $0.isHexDigit })
}`

/** Swift helpers every chart calls; written once, before the first chart. */
export const chartRuntime = {
  swiftRuntime: ({ theme, font, metric, motion }) => `${chartGeometry}

/// How chart marks move: the theme's data timing, run by Jolt. Reduce Motion settles them.
let mavisDataMotion = try! JoltTransition.tween(milliseconds: ${theme.motion.enterDuration * 2.4}, ease: .${theme.motion.ease})

/// A color a source gives a chart, or nil for the theme's.
func mavisHexColor(_ color: String?) -> Color? {
    guard let color, mavisIsHex(color) else { return nil }
    return mavisColor(color)
}

/// Numbers SwiftUI moves together: the points of a line, the ends of each arc, the bars.
struct MavisVector: VectorArithmetic {
    var values: [Double]

    init(_ values: [Double] = []) { self.values = values }

    static var zero: MavisVector { MavisVector() }

    private static func each(_ a: MavisVector, _ b: MavisVector, _ combine: (Double, Double) -> Double) -> MavisVector {
        let count = Swift.max(a.values.count, b.values.count)
        return MavisVector((0..<count).map { combine($0 < a.values.count ? a.values[$0] : 0, $0 < b.values.count ? b.values[$0] : 0) })
    }

    static func + (a: MavisVector, b: MavisVector) -> MavisVector { each(a, b, +) }
    static func - (a: MavisVector, b: MavisVector) -> MavisVector { each(a, b, -) }
    mutating func scale(by factor: Double) { values = values.map { $0 * factor } }
    var magnitudeSquared: Double { values.reduce(0) { $0 + $1 * $1 } }
}

/// The caption line of a chart: its summary, a value of its data list.
struct MavisChartCaption: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let text: String
    var muted: Bool = false

    var body: some View {
        Text(verbatim: text)
            .font(${font('caption')})
            .foregroundStyle(muted ? MavisTokens.muted : MavisTokens.text)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// A box of one side that never grows past the width it is given, as width with max-width 100%
/// and an aspect ratio on the Web. ratio is its height for each unit of width.
struct MavisPlotBox: Layout {
    var side: Double
    var ratio: Double = 1

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let offered = proposal.width.flatMap { $0.isFinite ? Double($0) : nil } ?? side
        let width = Swift.max(0, Swift.min(side, offered))
        return CGSize(width: width, height: width * ratio)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        for subview in subviews {
            subview.place(at: bounds.origin, anchor: .topLeading, proposal: ProposedViewSize(bounds.size))
        }
    }
}

/// The outlines the Mavis core strokes, each in its own box of 100 units across: donutPath, a
/// full turn from the top, and the half turn of a semi gauge from the left over the top.
enum MavisOutline: Equatable {
    case ring, half

    var height: Double { self == .half ? 58 : 100 }

    var path: Path {
        var path = Path()
        path.addArc(
            center: CGPoint(x: 50, y: 50), radius: 40,
            startAngle: .degrees(self == .half ? 180 : -90), endAngle: .degrees(self == .half ? 360 : 270), clockwise: false
        )
        return path
    }
}

/// A stretch of an outline, from one share of its length to another, as strokeStart and
/// strokeEnd of the shapes Jolt draws on the Web.
struct MavisStretch: Shape {
    var outline: MavisOutline = .ring
    var from: Double
    var to: Double

    var animatableData: AnimatablePair<Double, Double> {
        get { AnimatablePair(from, to) }
        set {
            from = newValue.first
            to = newValue.second
        }
    }

    func path(in rect: CGRect) -> Path {
        guard to > from else { return Path() }
        return outline.path
            .trimmedPath(from: Swift.max(0, from), to: Swift.min(1, to))
            .applying(CGAffineTransform(scaleX: rect.width / 100, y: rect.height / outline.height))
    }
}

/// One stroke of a ring or an arc. Jolt sweeps it from its start when it appears and moves its
/// ends when they change; Reduce Motion puts it there.
struct MavisSweep: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    var outline: MavisOutline = .ring
    let from: Double
    let to: Double
    let style: AnyShapeStyle
    let width: Double
    let animated: Bool
    @State private var drawn = false

    var body: some View {
        MavisStretch(outline: outline, from: from, to: drawn || !animated ? to : from)
            .stroke(style, style: StrokeStyle(lineWidth: width, lineCap: .round, lineJoin: .round))
            .joltLayout(value: animated ? [from, to, drawn ? 1 : 0] : [], transition: ${motion('data', 'mavisDataMotion')})
            .onAppear { drawn = true }
    }
}

@MainActor private final class MavisRoll: ObservableObject {
    var format: (Double) -> String
    private(set) var number: JoltRollingNumber!

    init(_ value: Double, _ format: @escaping (Double) -> String) {
        self.format = format
        number = try! JoltRollingNumber(value, format: { [unowned self] in self.format($0) }, options: try! JoltRollOptions(duration: 650, stagger: 24))
    }
}

private struct MavisRollingNumber: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let value: Double
    let format: (Double) -> String
    @StateObject private var roll: MavisRoll

    init(value: Double, format: @escaping (Double) -> String) {
        self.value = value
        self.format = format
        _roll = StateObject(wrappedValue: MavisRoll(value, format))
    }

    var body: some View {
        JoltRollingText(roll.number, alignment: .center)
            .onChange(of: format(value)) { _, _ in
                roll.format = format
                try? roll.number.roll(to: value)
            }
    }
}

/// The number in the middle of a chart, through its formatter. With roll, Jolt rolls the digits
/// that change, as MNumberFlow does on the Web; Reduce Motion shows the new number.
struct MavisChartNumber: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let value: Double
    var roll: Bool = false
    let format: (Double) -> String

    var body: some View {
        Group {
            if roll, value.isFinite, format(value).count <= 256 {
                MavisRollingNumber(value: value, format: format)
            } else {
                Text(verbatim: format(value)).monospacedDigit()
            }
        }
        .font(${font('display')})
        .foregroundStyle(MavisTokens.text)
        .lineLimit(1)
        .fixedSize()
    }
}`,
}
