// MChart: lines or grouped bars over categories, with the legend, the selectors and the data
// list that say the same as the plot.
import { expression, handlerJs, js, wrap } from '../js-text.mjs'
import { bounded, chartRuntime, domain, formatter, records, swiftRecords } from './chart-kit.mjs'
import { flexRuntime } from './flex.mjs'
import { swiftIcon } from './icon.mjs'

const types = ['line', 'bar']
const palette = ['primary', 'accent', 'success', 'warning', 'danger', 'muted', 'text', 'border']

/** chartGeometry and chartHitTest of the Mavis core, and what interpolateChart moves, without any view. */
export const chartPlotGeometry = `/// A category of an MChart, whatever record the source keeps it in.
struct MavisChartCategory: Hashable {
    let key: String
    let label: String
}

/// A series of an MChart: a value, or none, for each category.
struct MavisChartSeries: Hashable {
    let key: String
    let label: String
    let values: [Double?]
    let color: String?
}

/// The mark an MChart selects: a category and a series, by their keys.
struct MavisChartSelection: Hashable {
    let category: String
    let series: String
}

/// A value where chartGeometry places it: x from the left and y from the top, each from 0 to 1.
struct MavisChartMark: Equatable {
    let index: Int
    let value: Double
    let x: Double
    let y: Double
}

struct MavisChartLine: Equatable {
    let key: String
    var points: [MavisChartMark?]
}

struct MavisChartGeometry: Equatable {
    let scale: MavisChartScale
    var series: [MavisChartLine]
}

/// chartGeometry in the Mavis core: one axis for every series, hidden ones too, and each value
/// in the middle of its category. Nil for data the core function rejects.
func mavisChartGeometry(_ categories: [MavisChartCategory], _ series: [MavisChartSeries], domain: [Double]?) -> MavisChartGeometry? {
    guard Set(categories.map(\\.key)).count == categories.count, Set(series.map(\\.key)).count == series.count,
          categories.count <= 100, series.count <= 8,
          categories.allSatisfy({ !mavisTrim($0.label).isEmpty }) else { return nil }
    for item in series {
        guard !mavisTrim(item.label).isEmpty, item.values.count == categories.count else { return nil }
        if let color = item.color, !color.isEmpty, !mavisIsHex(color) { return nil }
    }
    guard let scale = mavisChartScale(series.flatMap(\\.values), domain: domain) else { return nil }
    let count = Double(Swift.max(1, categories.count))
    return MavisChartGeometry(scale: scale, series: series.map { item in
        MavisChartLine(key: item.key, points: item.values.enumerated().map { index, value in
            value.map { MavisChartMark(index: index, value: $0, x: (Double(index) + 0.5) / count, y: scale.y($0)) }
        })
    })
}

/// chartHitTest in the Mavis core: the mark under a place of the plot, x and y from 0 to 1. A
/// bar is found by its slot in the category; on lines the series nearest in height wins.
func mavisChartHitTest(_ geometry: MavisChartGeometry, bars: Bool, x: Double, y: Double) -> (category: Int, series: Int)? {
    let count = geometry.series.first?.points.count ?? 0
    guard count > 0, x.isFinite, y.isFinite else { return nil }
    let category = Int(Swift.max(0, Swift.min(Double(count - 1), (x * Double(count)).rounded(.down))))
    if bars {
        let within = x * Double(count) - Double(category)
        let slot = (((within - 0.15) / 0.7) * Double(geometry.series.count)).rounded(.down)
        let series = Int(Swift.max(0, Swift.min(Double(geometry.series.count - 1), slot)))
        return geometry.series[series].points[category] != nil ? (category, series) : nil
    }
    var nearest = -1
    var distance = Double.infinity
    for (index, line) in geometry.series.enumerated() {
        if let point = line.points[category], abs(point.y - y) < distance {
            nearest = index
            distance = abs(point.y - y)
        }
    }
    return nearest < 0 ? nil : (category, nearest)
}

/// What a series moves by when its values change: where zero sits, then how far each value is
/// from it, and nothing for a gap or a hidden series. Moving these in a straight line is
/// interpolateChart in the Mavis core: a value that was not there grows from the zero line.
func mavisChartOffsets(_ line: MavisChartLine, zero: Double) -> [Double] {
    [zero] + line.points.map { $0.map { $0.y - zero } ?? 0 }
}`

const series = records('MChart', '{ key: string; label: string; values: (number | null)[] }', [
  ['key', 'string'],
  ['label', 'string'],
  ['values', 'numbers'],
  ['color', 'string', false],
])

// chartProps. The selection and the hidden series are the source's: value is { category, series }
// by their keys, or nothing, and hiddenSeries the keys left out of the plot. Keys are strings.
export const MChart = {
  props: {
    id: 'string',
    label: 'string',
    description: 'string',
    categories: records('MChart', '{ key: string; label: string }', [
      ['key', 'string'],
      ['label', 'string'],
    ]),
    series,
    type: 'string',
    domain,
    height: bounded((value) => value >= 120 && value <= 800, 'is from 120 to 800.'),
    value: ({ value, ctx, expr, record, T }) => ({
      expr: expr(value, ctx, T.optional(record('ChartSelection'))),
    }),
    onChange: 'chart-selection-handler',
    disabled: 'boolean',
    hiddenSeries: ({ value, ctx, expr, T }) => ({ expr: expr(value, ctx, T.array(T.string)) }),
    onHiddenSeriesChange: 'chart-keys-handler',
    formatValue: formatter,
    showData: 'boolean',
    showDataLabel: 'string',
    hideDataLabel: 'string',
    emptyLabel: 'string',
    missingLabel: 'string',
    clearLabel: 'string',
    categoryLabel: 'string',
    seriesLabel: 'string',
  },
  required: ['label', 'categories', 'series'],
  control: true,
  handlers: {
    'chart-selection-handler': ({ T, record }) => [T.optional(record('ChartSelection'))],
    'chart-keys-handler': ({ T }) => [T.array(T.string)],
  },
  uses: [flexRuntime, chartRuntime],
  types: () => `type MavisChartType = ${types.map((type) => JSON.stringify(type)).join(' | ')}
/** A place along the axis of an MChart. */
type ChartCategory = { key: string; label: string }
/** A series of an MChart: a value for each category, or null for a gap; color is a six-digit hex. */
type ChartSeries = { key: string; label: string; values: readonly (number | null)[]; color?: string }
/** The mark an MChart selects, by the keys of its category and its series. */
type ChartSelection = { category: string; series: string }`,
  records: {
    ChartCategory: 'the Mavis chart category type',
    ChartSeries: 'the Mavis chart series type',
    ChartSelection: 'the Mavis chart selection type',
  },
  declaration:
    'declare function MChart(props: { id?: string; label: string; description?: string; categories: readonly ChartCategory[]; series: readonly ChartSeries[]; type?: MavisChartType; domain?: readonly [number, number]; height?: number; value?: ChartSelection | null; onChange?: (value: ChartSelection | null) => void; disabled?: boolean; hiddenSeries?: readonly string[]; onHiddenSeriesChange?: (keys: string[]) => void; formatValue?: (value: number) => string; showData?: boolean; showDataLabel?: string; hideDataLabel?: string; emptyLabel?: string; missingLabel?: string; clearLabel?: string; categoryLabel?: string; seriesLabel?: string }): JSX.Element',
  check({ props, attrs, fail }) {
    if (props.type && 'lit' in props.type && !types.includes(props.type.lit))
      fail(attrs.get('type'), 'type is line or bar.')
    if (props.series.fields.values.optional)
      fail(attrs.get('series'), 'Every series of MChart has values: one for each category.')
  },
  swift(node, { emit, indent }) {
    const pad = ' '.repeat(indent)
    const props = node.props
    const value = (name, label = name) =>
      props[name] ? [`${label}: ${emit.value(props[name])}`] : []
    const bars = !props.type
      ? []
      : [
          `bars: ${'lit' in props.type ? String(props.type.lit === 'bar') : `${emit.expr(props.type.expr)} == "bar"`}`,
        ]
    // The source keeps the selection in its own record; the chart asks for another in its own.
    const selection = props.onChange
      ? [
          `onChange: { mavisNext in\n${pad}        (${emit.handler(props.onChange, indent + 8)})(mavisNext.map { ChartSelection(category: $0.category, series: $0.series) })\n${pad}    }`,
        ]
      : []
    const args = [
      `label: ${emit.value(props.label)}`,
      ...value('description'),
      `categories: ${swiftRecords(props.categories, emit, 'MavisChartCategory', [
        ['key', 'key'],
        ['label', 'label'],
      ])}`,
      `series: ${swiftRecords(props.series, emit, 'MavisChartSeries', [
        ['key', 'key'],
        ['label', 'label'],
        ['values', 'values'],
        ['color', 'color'],
      ])}`,
      ...bars,
      ...(props.domain ? [`domain: ${emit.expr(props.domain.expr)}`] : []),
      ...value('height'),
      ...(props.value
        ? [
            `value: ${emit.wrap(props.value.expr)}.map { MavisChartSelection(category: $0.category, series: $0.series) }`,
          ]
        : []),
      ...selection,
      ...value('disabled'),
      ...value('hiddenSeries'),
      ...(props.onHiddenSeriesChange
        ? [`onHiddenSeriesChange: ${emit.handler(props.onHiddenSeriesChange, indent + 4)}`]
        : []),
      ...(props.formatValue ? [`format: ${emit.closure(props.formatValue.expr, 'String')}`] : []),
      ...value('showData'),
      ...value('showDataLabel'),
      ...value('hideDataLabel'),
      ...value('emptyLabel'),
      ...value('missingLabel'),
      ...value('clearLabel'),
      ...value('categoryLabel'),
      ...value('seriesLabel'),
    ]
    return [
      `${pad}MavisChart(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`,
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime: ({ theme, font }) => `${chartPlotGeometry}

/// The marks of one series in the plot: its line, its points or its bars. Jolt moves them when
/// the values change, by the offsets of mavisChartOffsets.
private struct MavisChartMarks: Shape {
    enum Kind: Equatable {
        case line
        case points(selected: Int?)
        case bars(slot: Int, slots: Int, only: Int?, except: Int?)
    }

    var kind: Kind
    var present: [Bool]
    var motion: MavisVector

    var animatableData: MavisVector {
        get { motion }
        set { motion = newValue }
    }

    func path(in rect: CGRect) -> Path {
        let values = motion.values
        let count = present.count
        var path = Path()
        guard count > 0, values.count == count + 1 else { return path }
        func x(_ index: Int) -> Double { (Double(index) + 0.5) / Double(count) * Double(rect.width) }
        func y(_ index: Int) -> Double { 8 + (values[0] + values[index + 1]) * (Double(rect.height) - 16) }
        switch kind {
        case .line:
            var open = false
            for index in 0..<count {
                guard present[index] else {
                    open = false
                    continue
                }
                let point = CGPoint(x: x(index), y: y(index))
                if open { path.addLine(to: point) } else { path.move(to: point) }
                open = true
            }
        case .points(let selected):
            for index in 0..<count where present[index] {
                let radius: Double = selected == index ? 5 : 3
                path.addEllipse(in: CGRect(x: x(index) - radius, y: y(index) - radius, width: radius * 2, height: radius * 2))
            }
        case .bars(let slot, let slots, let only, let except):
            let zero = 8 + values[0] * (Double(rect.height) - 16)
            let group = Double(rect.width) / Double(count) * 0.7
            let bar = group / Double(Swift.max(1, slots))
            for index in 0..<count where present[index] && (only == nil || only == index) && except != index {
                let top = y(index)
                path.addRoundedRect(
                    in: CGRect(x: x(index) - group / 2 + Double(slot) * bar, y: Swift.min(top, zero), width: bar * 0.82, height: Swift.max(1, abs(zero - top))),
                    cornerSize: CGSize(width: 3, height: 3)
                )
            }
        }
        return path
    }
}

/// The plot of an MChart: the grid, and for every series its marks in its color. A click
/// selects the mark chartHitTest finds under it.
private struct MavisChartPlot: View {
    let geometry: MavisChartGeometry
    let shown: [Bool]
    let colors: [Color]
    let bars: Bool
    let selected: (category: Int, series: Int)?
    let pick: (Int, Int) -> Void
    @Environment(\\.mavisTheme) private var theme

    private var visible: MavisChartGeometry {
        MavisChartGeometry(scale: geometry.scale, series: zip(geometry.series, shown).filter { $0.1 }.map { $0.0 })
    }

    private func marks(_ index: Int, _ kind: MavisChartMarks.Kind) -> MavisChartMarks {
        let line = geometry.series[index]
        let drawn = shown[index] ? line : MavisChartLine(key: line.key, points: line.points.map { _ in nil })
        return MavisChartMarks(kind: kind, present: drawn.points.map { $0 != nil }, motion: MavisVector(mavisChartOffsets(drawn, zero: geometry.scale.zero)))
    }

    var body: some View {
        let slots = shown.filter { $0 }.count
        let count = geometry.series.first?.points.count ?? 0
        GeometryReader { proxy in
            ZStack {
                Path { path in
                    for line in 0..<5 {
                        let y = 8 + (Double(proxy.size.height) - 16) * Double(line) / 4
                        path.move(to: CGPoint(x: 0, y: y))
                        path.addLine(to: CGPoint(x: Double(proxy.size.width), y: y))
                    }
                }
                .stroke(theme.palette.color(.border), style: StrokeStyle(lineWidth: 1, dash: [3, 6]))
                ForEach(Array(geometry.series.enumerated()), id: \\.element.key) { index, line in
                    let slot = shown.prefix(index).filter { $0 }.count
                    let chosen = selected.flatMap { $0.series == slot && shown[index] ? $0.category : nil }
                    Group {
                        if bars {
                            marks(index, .bars(slot: slot, slots: slots, only: nil, except: chosen))
                                .fill(colors[index])
                                .opacity(selected == nil ? 1 : 0.45)
                            marks(index, .bars(slot: slot, slots: slots, only: chosen ?? -1, except: nil))
                                .fill(colors[index])
                        } else {
                            marks(index, .line)
                                .stroke(colors[index], style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round))
                            marks(index, .points(selected: chosen))
                                .fill(colors[index])
                            marks(index, .points(selected: chosen))
                                .stroke(theme.palette.color(.surface), lineWidth: 2)
                        }
                    }
                    .id(String(count) + ":" + line.key)
                }
            }
            .joltLayout(value: [geometry.scale.zero] + zip(geometry.series, shown).flatMap { line, on in line.points.map { on ? $0?.y ?? -1 : -1 } }, transition: mavisDataMotion)
            .contentShape(Rectangle())
            .onTapGesture { location in
                guard proxy.size.width > 0, proxy.size.height > 16 else { return }
                let x = Double(location.x) / Double(proxy.size.width)
                let y = (Double(location.y) - 8) / (Double(proxy.size.height) - 16)
                if let hit = mavisChartHitTest(visible, bars: bars, x: x, y: y) { pick(hit.category, hit.series) }
            }
        }
        .accessibilityHidden(true)
    }
}

/// MChart: the heading, the legend, the plot beside its axis, the summary, the selectors and
/// the data list, as createChart in the Mavis core builds them. The selection and the hidden
/// series belong to the source. Jolt brings the plot in and moves its marks when the data
/// changes; Reduce Motion puts them there. Data the Web rejects shows as an empty chart here.
struct MavisChart: View {
    let label: String
    var description: String? = nil
    let categories: [MavisChartCategory]
    let series: [MavisChartSeries]
    var bars: Bool = false
    var domain: [Double]? = nil
    var height: Double = 240
    var value: MavisChartSelection? = nil
    var onChange: (MavisChartSelection?) -> Void = { _ in }
    var disabled: Bool = false
    var hiddenSeries: [String] = []
    var onHiddenSeriesChange: ([String]) -> Void = { _ in }
    var format: ((Double) -> String)? = nil
    var showData: Bool = false
    var showDataLabel: String = "Show data"
    var hideDataLabel: String = "Hide data"
    var emptyLabel: String = "No chart data"
    var missingLabel: String = "No value"
    var clearLabel: String = "Clear selection"
    var categoryLabel: String = "Category"
    var seriesLabel: String = "Series"
    @State private var toggled: Bool? = nil
    @State private var entered = false
    @Environment(\\.mavisTheme) private var theme

    private static let palette: [MavisToken] = [${palette.map((token) => `.${token}`).join(', ')}]
    private static let entry = try! JoltPose(y: 6, opacity: 0.35)
    private static let enter = try! JoltTransition.tween(milliseconds: ${theme.motion.enterDuration}, ease: .${theme.motion.ease})

    private var dataOpen: Bool { toggled ?? showData }
    private var plotHeight: Double { Swift.min(800, Swift.max(120, height)) }
    private var visible: [MavisChartSeries] { series.filter { !hiddenSeries.contains($0.key) } }

    private func text(_ value: Double?) -> String {
        guard let value else { return missingLabel }
        return format?(value) ?? mavisString(value)
    }

    private func color(_ index: Int) -> Color {
        mavisHexColor(series[index].color) ?? theme.palette.color(Self.palette[index % Self.palette.count])
    }

    /// The selection as places in the categories and the visible series, when both are there.
    private var selected: (category: Int, series: Int)? {
        guard let value,
              let category = categories.firstIndex(where: { $0.key == value.category }),
              let series = visible.firstIndex(where: { $0.key == value.series }) else { return nil }
        return (category, series)
    }

    private func choose(_ category: Int, _ series: Int) {
        guard !disabled, categories.indices.contains(category), visible.indices.contains(series) else { return }
        onChange(MavisChartSelection(category: categories[category].key, series: visible[series].key))
    }

    private var summary: String {
        guard let selected else { return description ?? label }
        let series = visible[selected.series]
        return categories[selected.category].label + " \\u{B7} " + series.label + ": " + text(selected.category < series.values.count ? series.values[selected.category] : nil)
    }

    private func line(_ text: String, muted: Bool = false, weight: Font.Weight? = nil) -> some View {
        Text(verbatim: text)
            .font(${font('body')})
            .fontWeight(weight)
            .foregroundStyle(muted ? MavisTokens.muted : MavisTokens.text)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var legend: some View {
        MavisRow(spacing: ${theme.space.xs}, wrap: true) {
            ForEach(Array(series.enumerated()), id: \\.element.key) { index, item in
                let shown = !hiddenSeries.contains(item.key)
                Button(action: {
                    if !disabled { onHiddenSeriesChange(shown ? hiddenSeries + [item.key] : hiddenSeries.filter { $0 != item.key }) }
                }) {
                    HStack(spacing: 8) {
                        Circle().fill(shown ? color(index) : theme.palette.color(.border)).frame(width: 8, height: 8)
                        Text(verbatim: item.label)
                    }
                }
                .buttonStyle(MavisButtonStyle(variant: shown ? .secondary : .ghost, size: .sm))
                .disabled(disabled)
                .accessibilityAddTraits(shown ? .isSelected : [])
            }
        }
    }

    private func axis(_ geometry: MavisChartGeometry?) -> some View {
        MavisColumn(justify: .between) {
            ForEach(Array((geometry?.scale.ticks ?? []).reversed().enumerated()), id: \\.offset) { _, tick in
                Text(verbatim: text(tick))
                    .font(${font('caption')})
                    .foregroundStyle(MavisTokens.muted)
                    .multilineTextAlignment(.trailing)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }
        }
        .frame(width: 56, height: plotHeight)
    }

    @ViewBuilder private func plot(_ geometry: MavisChartGeometry?) -> some View {
        let shown = series.map { !hiddenSeries.contains($0.key) }
        if let geometry, zip(geometry.series, shown).contains(where: { line, on in on && line.points.contains { $0 != nil } }) {
            MavisChartPlot(geometry: geometry, shown: shown, colors: series.indices.map(color), bars: bars, selected: selected, pick: choose)
        } else {
            Text(verbatim: emptyLabel)
                .font(${font('body')})
                .foregroundStyle(MavisTokens.muted)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    private var selectors: some View {
        MavisRow(spacing: ${theme.space.sm}, wrap: true) {
            MavisSelect(
                label: categoryLabel,
                value: value?.category,
                options: categories.map { MavisChoice(value: $0.key, label: $0.label, disabled: false) },
                onChange: { key in choose(categories.firstIndex(where: { $0.key == key }) ?? -1, selected?.series ?? 0) },
                placeholder: categoryLabel,
                disabled: disabled
            )
            .mavisItem(grow: 1, shrink: 1)
            MavisSelect(
                label: seriesLabel,
                value: visible[selected?.series ?? 0].key,
                options: visible.map { MavisChoice(value: $0.key, label: $0.label, disabled: false) },
                onChange: { key in choose(selected?.category ?? 0, visible.firstIndex(where: { $0.key == key }) ?? -1) },
                disabled: disabled
            )
            .mavisItem(grow: 1, shrink: 1)
        }
    }

    private var data: some View {
        MavisColumn(spacing: ${theme.space.sm}) {
            ForEach(Array(categories.enumerated()), id: \\.element.key) { index, category in
                MavisColumn(spacing: ${theme.space.xs}) {
                    line(category.label, weight: .semibold)
                    ForEach(series, id: \\.key) { item in
                        MavisChartCaption(text: item.label + ": " + text(index < item.values.count ? item.values[index] : nil), muted: true)
                    }
                }
                .padding(${theme.space.sm})
                .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${theme.radius.md}))
            }
        }
    }

    var body: some View {
        let geometry = mavisChartGeometry(categories, series, domain: domain)
        MavisColumn(spacing: ${theme.space.md}) {
            MavisColumn(spacing: ${theme.space.xs}) {
                Text(verbatim: label)
                    .font(${font('heading')})
                    .foregroundStyle(MavisTokens.text)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityHeading(.h2)
                if let description, !description.isEmpty {
                    MavisChartCaption(text: description, muted: true)
                }
            }
            legend
            HStack(alignment: .top, spacing: ${theme.space.xs}) {
                axis(geometry)
                plot(geometry)
                    .frame(maxWidth: .infinity, minHeight: plotHeight, maxHeight: plotHeight)
                    .joltMotion(to: entered ? .identity : Self.entry, transition: Self.enter)
            }
            if let first = categories.first {
                HStack(alignment: .top, spacing: ${theme.space.sm}) {
                    Text(verbatim: first.label)
                        .font(${font('caption')})
                        .foregroundStyle(MavisTokens.muted)
                    Spacer(minLength: 0)
                    if categories.count > 1, let last = categories.last {
                        Text(verbatim: last.label)
                            .font(${font('caption')})
                            .foregroundStyle(MavisTokens.muted)
                            .multilineTextAlignment(.trailing)
                    }
                }
            }
            line(summary, weight: .semibold)
            if !categories.isEmpty && !visible.isEmpty {
                selectors
            }
            MavisRow(spacing: ${theme.space.sm}, wrap: true) {
                Button(action: { toggled = !dataOpen }) {
                    HStack(spacing: 8) {
                        ${swiftIcon('table-2', 20)}
                        Text(verbatim: dataOpen ? hideDataLabel : showDataLabel)
                    }
                }
                .buttonStyle(MavisButtonStyle(variant: .ghost))
                if selected != nil {
                    Button(action: { if !disabled { onChange(nil) } }) {
                        Text(verbatim: clearLabel)
                    }
                    .buttonStyle(MavisButtonStyle(variant: .ghost))
                    .disabled(disabled)
                }
            }
            JoltPresence(dataOpen) {
                data
            }
        }
        .onAppear { entered = true }
        .onChange(of: showData) { _, _ in toggled = nil }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}`,
  vue: {
    rename: {
      value: 'modelValue',
      onChange: 'update:modelValue',
      onHiddenSeriesChange: 'update:hiddenSeries',
    },
    types: ['ChartCategory', 'ChartSeries', 'ChartSelection'],
    attribute(name, value) {
      // Mavis takes null for a gap and for no selection, and reports keys as it was given
      // them: text or numbers. The model keeps a missing value and text keys.
      if (name === 'series' && value.fields.values.gaps)
        return `:series="${expression(`${wrap(value.expr)}.map((entry) => ({ ...entry, values: entry.values.map((value) => value ?? null) }))`)}"`
      if (name === 'value') return `:modelValue="${expression(`${js(value.expr)} ?? null`)}"`
      if (name === 'onChange')
        return `@update:modelValue="${expression(`(next) => (${handlerJs(value)})(next ? { category: String(next.category), series: String(next.series) } : undefined)`)}"`
      if (name === 'onHiddenSeriesChange')
        return `@update:hiddenSeries="${expression(`(keys) => (${handlerJs(value)})(keys.map(String))`)}"`
    },
  },
}
