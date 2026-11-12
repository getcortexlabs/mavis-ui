// MSparkline: the compact trend line of the Mavis dashboard family.
import { expression } from '../js-text.mjs'
import {
  bounded,
  chartRuntime,
  domain,
  formatter,
  nulled,
  records,
  swiftColor,
  swiftRecords,
} from './chart-kit.mjs'
import { flexRuntime } from './flex.mjs'

/** sparklineGeometry of the Mavis core, without any view. */
export const sparklineGeometry = `/// One run of a sparkline between gaps, named by its first point.
struct MavisSparkPath: Equatable, Identifiable {
    let id: String
    var points: [CGPoint]
}

/// sparklineGeometry in the Mavis core: a line for each run of values between gaps, across the
/// width and inside the height, and a short stroke for a value on its own. Nil for data the
/// core function rejects.
func mavisSparklinePaths(_ points: [MavisChartPoint], domain: [Double]?, width: Double, height: Double) -> [MavisSparkPath]? {
    guard mavisDistinct(points.map(\\.id)), points.count <= 100,
          points.allSatisfy({ !mavisTrim($0.label).isEmpty }),
          let scale = mavisChartScale(points.map(\\.value), domain: domain) else { return nil }
    var paths: [MavisSparkPath] = []
    var run: [CGPoint] = []
    var id = ""
    func flush() {
        guard let first = run.first else { return }
        if run.count == 1 { run.append(CGPoint(x: Swift.min(width * 0.98, Double(first.x) + 0.01), y: Double(first.y))) }
        paths.append(MavisSparkPath(id: id, points: run))
        run = []
    }
    for (index, point) in points.enumerated() {
        guard let value = point.value else {
            flush()
            continue
        }
        if run.isEmpty { id = point.id }
        let x = (points.count == 1 ? 0.5 : 0.02 + (Double(index) / Double(points.count - 1)) * 0.96) * width
        run.append(CGPoint(x: x, y: (0.1 + scale.y(value) * 0.8) * height))
    }
    flush()
    return paths
}`

// sparklineProps: a line over the summary of its data and the list that spells it out. A null
// value leaves a gap; formatValue is the text of each value.
export const MSparkline = {
  props: {
    id: 'string',
    label: 'string',
    points: records('MSparkline', '{ id: string; label: string; value: number | null }', [
      ['id', 'string'],
      ['label', 'string'],
      ['value', 'number'],
    ]),
    domain,
    height: bounded((value) => value >= 24 && value <= 240, 'is from 24 to 240.'),
    color: 'color',
    animated: 'boolean',
    showData: 'boolean',
    dataLabel: 'string',
    emptyLabel: 'string',
    formatValue: formatter,
  },
  required: ['label', 'points'],
  control: true,
  uses: [flexRuntime, chartRuntime],
  types: () => `/** One value of an MSparkline; null leaves a gap in the line. */
type SparklinePoint = { id: string; label: string; value: number | null }`,
  records: { SparklinePoint: 'the Mavis sparkline point type' },
  declaration:
    'declare function MSparkline(props: { id?: string; label: string; points: readonly SparklinePoint[]; domain?: readonly [number, number]; height?: number; color?: string; animated?: boolean; showData?: boolean; dataLabel?: string; emptyLabel?: string; formatValue?: (value: number) => string }): JSX.Element',
  swift(node, { emit, indent }) {
    const pad = ' '.repeat(indent)
    const props = node.props
    const value = (name) => (props[name] ? [`${name}: ${emit.value(props[name])}`] : [])
    const args = [
      `label: ${emit.value(props.label)}`,
      `points: ${swiftRecords(props.points, emit, 'MavisChartPoint', [
        ['id', 'id'],
        ['label', 'label'],
        ['value', 'value'],
      ])}`,
      ...(props.domain ? [`domain: ${emit.expr(props.domain.expr)}`] : []),
      ...value('height'),
      ...(props.color ? [`color: ${swiftColor(props.color, emit)}`] : []),
      ...value('animated'),
      ...value('showData'),
      ...value('dataLabel'),
      ...value('emptyLabel'),
      ...(props.formatValue ? [`format: ${emit.closure(props.formatValue.expr, 'String')}`] : []),
    ]
    return [
      `${pad}MavisSparkline(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`,
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime: ({ theme }) => `${sparklineGeometry}

/// The points of a line, and how much of it is drawn from its start.
private struct MavisPolyline: Shape {
    var points: MavisVector
    var end: Double

    var animatableData: AnimatablePair<Double, MavisVector> {
        get { AnimatablePair(end, points) }
        set {
            end = newValue.first
            points = newValue.second
        }
    }

    func path(in rect: CGRect) -> Path {
        let values = points.values
        var path = Path()
        guard values.count >= 4 else { return path }
        path.move(to: CGPoint(x: values[0], y: values[1]))
        for index in stride(from: 2, to: values.count - 1, by: 2) {
            path.addLine(to: CGPoint(x: values[index], y: values[index + 1]))
        }
        return path.trimmedPath(from: 0, to: Swift.min(1, Swift.max(0, end)))
    }
}

/// What a run of a sparkline moves for: new values, and its first appearance.
private struct MavisSparkMotion: Equatable {
    var values: [Double?] = []
    var domain: [Double]? = nil
    var drawn = true
}

/// One run of a sparkline. Jolt draws it in when it appears and moves it to new values of the
/// same points; with more or fewer points it is another line, shown at once, as on the Web.
private struct MavisSparkStroke: View {
    let points: [CGPoint]
    let style: AnyShapeStyle
    let animated: Bool
    let values: [Double?]
    let domain: [Double]?
    @State private var drawn = false

    var body: some View {
        MavisPolyline(points: MavisVector(points.flatMap { [Double($0.x), Double($0.y)] }), end: drawn || !animated ? 1 : 0)
            .stroke(style, style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round))
            .id(points.count)
            .transition(.identity)
            .joltLayout(value: animated ? MavisSparkMotion(values: values, domain: domain, drawn: drawn) : MavisSparkMotion(), transition: mavisDataMotion)
            .onAppear { drawn = true }
    }
}

/// MSparkline: a trend line over the summary of its data and the list that spells it out, as
/// createSparkline in the Mavis core builds them. Data the Web rejects draws no line here.
struct MavisSparkline: View {
    let label: String
    let points: [MavisChartPoint]
    var domain: [Double]? = nil
    var height: Double = 64
    var color: Color? = nil
    var animated: Bool = true
    var showData: Bool = false
    var dataLabel: String = "View data"
    var emptyLabel: String = "No data"
    var format: (Double) -> String = { mavisString($0) }
    @State private var open = false

    private var plotHeight: Double { Swift.min(240, Swift.max(24, height)) }

    private var summary: String {
        let data = points.filter { $0.value != nil }
        guard let first = data.first, let last = data.last, let from = first.value, let to = last.value else {
            return label + ": " + emptyLabel
        }
        return label + ": " + format(to) + " (" + first.label + ": " + format(from) + ", " + last.label + ": " + format(to) + ")"
    }

    private var plot: some View {
        GeometryReader { proxy in
            let paths = mavisSparklinePaths(points, domain: domain, width: Double(proxy.size.width), height: plotHeight) ?? []
            ZStack(alignment: .topLeading) {
                ForEach(paths) { path in
                    MavisSparkStroke(
                        points: path.points,
                        style: color.map { AnyShapeStyle($0) } ?? AnyShapeStyle(MavisTokens.primary),
                        animated: animated,
                        values: points.map(\\.value),
                        domain: domain
                    )
                }
            }
        }
        .frame(height: plotHeight)
        .accessibilityHidden(true)
    }

    var body: some View {
        MavisColumn(spacing: ${theme.space.xs}) {
            plot
            MavisChartCaption(text: summary, muted: true)
            Button(action: { open.toggle() }) {
                Text(verbatim: dataLabel)
            }
            .buttonStyle(MavisButtonStyle(variant: .ghost, size: .sm))
            if open || showData {
                MavisColumn(spacing: ${theme.space.xs}) {
                    ForEach(points, id: \\.id) { point in
                        MavisChartCaption(text: point.label + ": " + (point.value.map(format) ?? "\\u{2014}"))
                    }
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}`,
  vue: {
    types: ['SparklinePoint'],
    attribute(name, value) {
      if (name === 'points') return `:points="${expression(nulled(value))}"`
    },
  },
}
