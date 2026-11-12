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
  swiftRuntime: ({ theme, font }) => `${chartGeometry}

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
    let text: String
    var muted: Bool = false

    var body: some View {
        Text(verbatim: text)
            .font(${font('caption')})
            .foregroundStyle(muted ? MavisTokens.muted : MavisTokens.text)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}`,
}
