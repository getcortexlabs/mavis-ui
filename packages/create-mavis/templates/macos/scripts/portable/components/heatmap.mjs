// MHeatmap: the days of a period in week columns, each painted by its value.
import { expression, js } from '../js-text.mjs'
import { bounded, chartRuntime, formatter, nulled, records, swiftRecords } from './chart-kit.mjs'
import { flexRuntime } from './flex.mjs'
import { event } from './choices.mjs'

const scale = ['#E6E4EB', '#C6ABCD', '#9B6AA9', '#704080', '#4C245C']
const hex = /^#[0-9a-f]{6}$/i

const monthDays = (year, month) =>
  month === 2
    ? year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
      ? 29
      : 28
    : [4, 6, 9, 11].includes(month)
      ? 30
      : 31
/** Whether text is a civil date of the Mavis core: Gregorian YYYY-MM-DD from year 1. */
const isCivilDate = (text) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false
  const [year, month, day] = text.split('-').map(Number)
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= monthDays(year, month)
}

// A date written out is checked while generating; one that is computed, when it is drawn.
function day({ key, value, attribute, ctx, expr, fail, T, ts }) {
  if (!ts.isStringLiteral(value)) return { expr: expr(value, ctx, T.string) }
  if (!isCivilDate(value.text))
    fail(attribute, `${key} is a date as YYYY-MM-DD, such as 2026-09-01.`)
  return { lit: value.text }
}

// colors: the scale from the lowest value to the highest, two to eight six-digit hex colors.
function colors({ value, attribute, ctx, expr, fail, T, ts }) {
  const list = expr(value, ctx, T.array(T.string))
  if (ts.isArrayLiteralExpression(value)) {
    if (value.elements.length < 2 || value.elements.length > 8)
      fail(attribute, 'colors is a scale of 2 to 8 colors.')
    for (const item of list.items)
      if (item.e === 'lit' && !hex.test(item.value))
        fail(attribute, 'colors takes six-digit hex colors, such as "#9B6AA9".')
  }
  return { expr: list }
}

/** heatmapCalendar and heatmapColor of the Mavis core, with the civil dates they need, without any view. */
export const heatmapGeometry = `/// A day of an MHeatmap, whatever record the source keeps it in.
struct MavisHeatmapValue: Hashable {
    let date: String
    let value: Double?
    let label: String?
    let disabled: Bool?
}

/// A day where heatmapCalendar places it: its week is its column, its weekday its row.
struct MavisHeatmapCell: Equatable, Identifiable {
    let date: String
    let value: Double?
    let label: String?
    let disabled: Bool
    let index: Int
    let row: Int
    let column: Int

    var id: String { date }
}

func mavisDaysInMonth(_ year: Int, _ month: Int) -> Int {
    if month == 2 { return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) ? 29 : 28 }
    return [4, 6, 9, 11].contains(month) ? 30 : 31
}

func mavisDaysBeforeYear(_ year: Int) -> Int {
    let previous = year - 1
    return 365 * previous + previous / 4 - previous / 100 + previous / 400
}

/// The days from 0001-01-01 to a civil date of the Mavis core, or nil when the text is not one.
func mavisCivilOrdinal(_ date: String) -> Int? {
    let scalars = Array(date.unicodeScalars)
    guard scalars.count == 10, scalars[4] == "-", scalars[7] == "-" else { return nil }
    func number(_ range: Range<Int>) -> Int? {
        var value = 0
        for scalar in scalars[range] {
            guard scalar.value >= 48, scalar.value <= 57 else { return nil }
            value = value * 10 + Int(scalar.value - 48)
        }
        return value
    }
    guard let year = number(0..<4), let month = number(5..<7), let day = number(8..<10),
          year >= 1, month >= 1, month <= 12, day >= 1, day <= mavisDaysInMonth(year, month) else { return nil }
    return mavisDaysBeforeYear(year) + day - 1 + (1..<month).reduce(0) { $0 + mavisDaysInMonth(year, $1) }
}

/// The civil date that many days after 0001-01-01, kept inside the years 1 to 9999.
func mavisCivilDate(_ ordinal: Int) -> String {
    let target = Swift.max(0, Swift.min(mavisDaysBeforeYear(10000) - 1, ordinal))
    var low = 1
    var high = 9999
    while low < high {
        let middle = (low + high + 1) / 2
        if mavisDaysBeforeYear(middle) <= target { low = middle } else { high = middle - 1 }
    }
    var day = target - mavisDaysBeforeYear(low) + 1
    var month = 1
    while day > mavisDaysInMonth(low, month) {
        day -= mavisDaysInMonth(low, month)
        month += 1
    }
    func padded(_ value: Int, _ length: Int) -> String {
        let digits = String(value)
        return String(repeating: "0", count: Swift.max(0, length - digits.count)) + digits
    }
    return padded(low, 4) + "-" + padded(month, 2) + "-" + padded(day, 2)
}

/// heatmapCalendar in the Mavis core: every day from start to end in week columns that begin
/// on Sunday (0) or Monday (1), with the value given for it, and the highest value. Nil for a
/// period or values the core function rejects.
func mavisHeatmapCalendar(start: String, end: String, values: [MavisHeatmapValue], weekStartsOn: Double) -> (cells: [MavisHeatmapCell], columns: Int, max: Double)? {
    guard weekStartsOn == 0 || weekStartsOn == 1,
          let first = mavisCivilOrdinal(start), let last = mavisCivilOrdinal(end),
          last >= first, last - first <= 365 else { return nil }
    var entries: [String: MavisHeatmapValue] = [:]
    for item in values {
        guard mavisCivilOrdinal(item.date) != nil, entries[item.date] == nil else { return nil }
        if let value = item.value, !(value.isFinite && value >= 0) { return nil }
        entries[item.date] = item
    }
    let leading = ((first + 1) % 7 - Int(weekStartsOn) + 7) % 7
    let cells = (0...(last - first)).map { offset -> MavisHeatmapCell in
        let date = mavisCivilDate(first + offset)
        let entry = entries[date]
        let index = leading + offset
        return MavisHeatmapCell(date: date, value: entry?.value, label: entry?.label, disabled: entry?.disabled ?? false, index: index, row: index % 7, column: index / 7)
    }
    return (cells, (cells.last?.column ?? 0) + 1, cells.reduce(0) { Swift.max($0, $1.value ?? 0) })
}

/// heatmapColor in the Mavis core: a value's color on a scale of 2 to 8 colors that ends at
/// max, and "transparent" for a day without one. Nil for a scale the core function rejects.
func mavisHeatmapColor(_ value: Double?, max: Double, colors: [String]) -> String? {
    guard colors.count >= 2, colors.count <= 8, colors.allSatisfy(mavisIsHex) else { return nil }
    guard let value else { return "transparent" }
    let last = Double(colors.count - 1)
    return colors[Int(Swift.min(last, ((max != 0 ? value / max : 0) * last).rounded(.down)))]
}`

// heatmapProps. The selected day is the source's: value is its date, or nothing, and onChange
// asks for the day that was pressed.
export const MHeatmap = {
  props: {
    id: 'string',
    label: 'string',
    start: day,
    end: day,
    values: records('MHeatmap', '{ date: string; value: number | null }', [
      ['date', 'string'],
      ['value', 'number'],
      ['label', 'string', false],
      ['disabled', 'boolean', false],
    ]),
    value: 'optional-string',
    onChange: event(({ T }) => [T.string], 'CivilDate'),
    colors,
    cellSize: bounded((value) => value >= 28 && value <= 80, 'is from 28 to 80.'),
    weekStartsOn: bounded(
      (value) => value === 0 || value === 1,
      'is 0 for Sunday or 1 for Monday.',
    ),
    animated: 'boolean',
    disabled: 'boolean',
    missingLabel: 'string',
    dataLabel: 'string',
    lessLabel: 'string',
    moreLabel: 'string',
    formatValue: formatter,
  },
  required: ['label', 'start', 'end', 'values'],
  control: true,
  uses: [flexRuntime, chartRuntime],
  types: () => `/** A calendar day as YYYY-MM-DD, without a time zone. */
type CivilDate = \`\${number}-\${number}-\${number}\`
/** A day of an MHeatmap: null is a day without a value, which is not zero. */
type HeatmapValue = { date: CivilDate; value: number | null; label?: string; disabled?: boolean }`,
  records: { HeatmapValue: 'the Mavis heatmap value type' },
  declaration:
    'declare function MHeatmap(props: { id?: string; label: string; start: CivilDate; end: CivilDate; values: readonly HeatmapValue[]; value?: CivilDate | null; onChange?: (date: CivilDate) => void; colors?: readonly string[]; cellSize?: number; weekStartsOn?: 0 | 1; animated?: boolean; disabled?: boolean; missingLabel?: string; dataLabel?: string; lessLabel?: string; moreLabel?: string; formatValue?: (value: number) => string }): JSX.Element',
  check({ props, attrs, fail }) {
    if ('lit' in props.start && 'lit' in props.end) {
      const start = Date.parse(`${props.start.lit}T00:00:00Z`)
      const end = Date.parse(`${props.end.lit}T00:00:00Z`)
      if (end < start || end - start > 365 * 86400000)
        fail(attrs.get('end'), 'MHeatmap range must contain 1–366 days.')
    }
  },
  swift(node, { emit, indent }) {
    const pad = ' '.repeat(indent)
    const props = node.props
    const value = (name, label = name) =>
      props[name] ? [`${label}: ${emit.value(props[name])}`] : []
    const args = [
      `label: ${emit.value(props.label)}`,
      `start: ${emit.value(props.start)}`,
      `end: ${emit.value(props.end)}`,
      `values: ${swiftRecords(props.values, emit, 'MavisHeatmapValue', [
        ['date', 'date'],
        ['value', 'value'],
        ['label', 'label'],
        ['disabled', 'disabled'],
      ])}`,
      ...value('value'),
      ...(props.onChange ? [`onChange: ${emit.handler(props.onChange, indent + 4)}`] : []),
      ...value('colors'),
      ...value('cellSize'),
      ...value('weekStartsOn'),
      ...value('animated'),
      ...value('disabled'),
      ...value('missingLabel'),
      ...value('dataLabel'),
      ...value('lessLabel'),
      ...value('moreLabel'),
      ...(props.formatValue ? [`format: ${emit.closure(props.formatValue.expr, 'String')}`] : []),
    ]
    return [
      `${pad}MavisHeatmap(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`,
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime({ theme, font, weight }) {
    const button = theme.components.button
    const radius = typeof button.radius === 'number' ? button.radius : theme.radius[button.radius]
    return `${heatmapGeometry}

/// Whether text on a color reads better dark: its luminance, as the Web picks black or white.
func mavisReadsDark(on color: String) -> Bool {
    let digits = Array(color.dropFirst())
    guard mavisIsHex(color) else { return true }
    let channels = stride(from: 0, to: 6, by: 2).map { offset -> Double in
        let value = Double((digits[offset].hexDigitValue ?? 0) * 16 + (digits[offset + 1].hexDigitValue ?? 0)) / 255
        return value <= 0.04045 ? value / 12.92 : pow((value + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2] > 0.179
}

/// A day of the grid: its color under a mark for a missing or a selected day. The press goes
/// through Jolt, and so does a change of color; Reduce Motion paints it at once.
private struct MavisHeatmapDay: ButtonStyle {
    let paint: String
    let chosen: Bool
    let side: Double
    let animated: Bool
    @Environment(\\.isEnabled) private var isEnabled
    private static let pressed = try! JoltPose(scale: ${theme.motion.pressScale})

    func makeBody(configuration: Configuration) -> some View {
        let painted = paint != "transparent"
        let ink: AnyShapeStyle = painted ? AnyShapeStyle(mavisReadsDark(on: paint) ? Color.black : Color.white) : AnyShapeStyle(MavisTokens.text)
        return configuration.label
            .font(.system(size: ${theme.control.sm.fontSize}, weight: .${weight(button.fontWeight)}))
            .frame(width: side, height: side)
            .foregroundStyle(ink)
            .overlay {
                if chosen {
                    RoundedRectangle(cornerRadius: ${radius}).strokeBorder(ink, lineWidth: 2).allowsHitTesting(false)
                }
            }
            .opacity(isEnabled ? 1 : 0.45)
            .background(painted ? mavisColor(paint) : Color.clear, in: RoundedRectangle(cornerRadius: ${theme.radius.sm}))
            .joltLayout(value: animated ? paint : "", transition: mavisDataMotion)
            .contentShape(Rectangle())
            .joltMotion(to: configuration.isPressed && isEnabled ? Self.pressed : .identity, transition: .spring(.snappy))
    }
}

/// MHeatmap: the grid of days, the scale and the list that spells the days out, as
/// createHeatmap in the Mavis core builds them. The selected day belongs to the source: a day
/// asks for itself when pressed. Arrow keys move between days, Home and End to the first and
/// the last. A period or values the Web rejects show no days here.
struct MavisHeatmap: View {
    let label: String
    let start: String
    let end: String
    let values: [MavisHeatmapValue]
    var value: String? = nil
    var onChange: (String) -> Void = { _ in }
    var colors: [String] = [${scale.map((color) => `"${color}"`).join(', ')}]
    var cellSize: Double = 40
    var weekStartsOn: Double = 1
    var animated: Bool = true
    var disabled: Bool = false
    var missingLabel: String = "No data"
    var dataLabel: String = "View data"
    var lessLabel: String = "Less"
    var moreLabel: String = "More"
    var format: ((Double) -> String)? = nil
    @State private var showData = false
    @FocusState private var focus: String?

    private var side: Double { Swift.min(80, Swift.max(28, cellSize)) }

    private func title(_ cell: MavisHeatmapCell) -> String {
        (cell.label ?? cell.date) + ": " + (cell.value.map { format?($0) ?? mavisString($0) } ?? missingLabel)
    }

    private func choose(_ cell: MavisHeatmapCell) {
        if !disabled && !cell.disabled { onChange(cell.date) }
    }

    private func move(_ press: KeyPress, from index: Int, in cells: [MavisHeatmapCell]) -> KeyPress.Result {
        let step: Int
        switch press.key {
        case .upArrow: step = -1
        case .downArrow: step = 1
        case .leftArrow: step = -7
        case .rightArrow: step = 7
        case .home: step = -index
        case .end: step = cells.count - 1 - index
        default: return .ignored
        }
        let target = cells[Swift.max(0, Swift.min(cells.count - 1, index + step))]
        if !target.disabled { focus = target.date }
        return .handled
    }

    private func grid(_ cells: [MavisHeatmapCell], columns: Int, max: Double) -> some View {
        let step = side + 4
        return ScrollView(.horizontal) {
            ZStack(alignment: .topLeading) {
                ForEach(Array(cells.enumerated()), id: \\.element.date) { index, cell in
                    let chosen = value == cell.date
                    Button(action: { choose(cell) }) {
                        Text(verbatim: cell.value == nil ? "\\u{B7}" : chosen ? "\\u{2713}" : " ")
                    }
                    .buttonStyle(MavisHeatmapDay(paint: mavisHeatmapColor(cell.value, max: max, colors: colors) ?? "transparent", chosen: chosen, side: side, animated: animated))
                    .disabled(disabled || cell.disabled)
                    .accessibilityLabel(Text(verbatim: title(cell)))
                    .accessibilityAddTraits(chosen ? .isSelected : [])
                    .focused($focus, equals: cell.date)
                    .onKeyPress { press in move(press, from: index, in: cells) }
                    .offset(x: Double(cell.column) * step, y: Double(cell.row) * step)
                }
            }
            .frame(width: Double(columns) * step, height: 7 * step, alignment: .topLeading)
        }
    }

    private var scale: some View {
        MavisRow(spacing: ${theme.space.xs}) {
            Text(verbatim: lessLabel)
                .font(${font('caption')})
                .foregroundStyle(MavisTokens.text)
            ForEach(Array(colors.enumerated()), id: \\.offset) { _, color in
                RoundedRectangle(cornerRadius: ${theme.radius.sm})
                    .fill(mavisColor(color))
                    .frame(width: 16, height: 16)
                    .accessibilityHidden(true)
            }
            Text(verbatim: moreLabel)
                .font(${font('caption')})
                .foregroundStyle(MavisTokens.text)
        }
    }

    var body: some View {
        let calendar = mavisHeatmapCalendar(start: start, end: end, values: values, weekStartsOn: weekStartsOn)
        let cells = calendar?.cells ?? []
        MavisColumn(spacing: ${theme.space.md}) {
            Text(verbatim: label)
                .font(${font('heading')})
                .foregroundStyle(MavisTokens.text)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
            grid(cells, columns: calendar?.columns ?? 0, max: calendar?.max ?? 0)
            scale
            Button(action: { showData.toggle() }) {
                Text(verbatim: dataLabel)
            }
            .buttonStyle(MavisButtonStyle(variant: .ghost))
            if showData {
                MavisColumn(spacing: ${theme.space.xs}) {
                    ForEach(cells) { cell in
                        Button(action: { choose(cell) }) {
                            Text(verbatim: title(cell))
                        }
                        .buttonStyle(MavisButtonStyle(variant: value == cell.date ? .secondary : .ghost))
                        .disabled(disabled || cell.disabled)
                    }
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}`
  },
  vue: {
    rename: { value: 'modelValue', onChange: 'update:modelValue' },
    types: ['HeatmapValue', 'CivilDate'],
    attribute(name, value) {
      // Mavis takes null for a day without a value and for no selection; the model keeps a
      // missing value.
      if (name === 'values') return `:values="${expression(nulled(value))}"`
      if (name === 'value') return `:modelValue="${expression(`${js(value.expr)} ?? null`)}"`
    },
  },
}
