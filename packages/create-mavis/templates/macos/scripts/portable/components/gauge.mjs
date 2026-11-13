// MGauge: a value inside its range as an arc, with the number under it.
import { bounded, chartRuntime, formatter, swiftColor } from './chart-kit.mjs'
import { flexRuntime } from './flex.mjs'

/** gaugeGeometry of the Mavis core, without any view. */
export const gaugeGeometry = `/// gaugeGeometry in the Mavis core: the value kept inside its range, and its share of the arc.
/// Nil where the core function throws: a number that is not finite, or a range that is empty.
func mavisGaugeGeometry(_ value: Double, min: Double, max: Double) -> (value: Double, ratio: Double)? {
    guard value.isFinite, min.isFinite, max.isFinite, max > min else { return nil }
    let clamped = Swift.min(max, Swift.max(min, value))
    return (clamped, (clamped - min) / (max - min))
}`

// gaugeProps: the arc fills with the value's share of min to max; semi draws half a turn.
export const MGauge = {
  props: {
    id: 'string',
    label: 'string',
    value: 'number',
    min: 'number',
    max: 'number',
    size: bounded((value) => value >= 80, 'is 80 or more.'),
    strokeWidth: bounded((value) => value > 0 && value <= 18, 'is above 0, up to 18.'),
    semi: 'boolean',
    animated: 'boolean',
    animateNumber: 'boolean',
    color: 'color',
    suffix: 'string',
    formatValue: formatter,
  },
  required: ['label', 'value'],
  uses: [flexRuntime, chartRuntime],
  declaration:
    'declare function MGauge(props: { id?: string; label: string; value: number; min?: number; max?: number; size?: number; strokeWidth?: number; semi?: boolean; animated?: boolean; animateNumber?: boolean; color?: string; suffix?: string; formatValue?: (value: number) => string }): JSX.Element',
  check({ props, attrs, fail }) {
    const literal = (prop, fallback) =>
      !prop ? fallback : prop.expr.e === 'lit' ? prop.expr.value : undefined
    const low = literal(props.min, 0)
    const high = literal(props.max, 100)
    if (low !== undefined && high !== undefined && !(high > low))
      fail(attrs.get('max') ?? attrs.get('min'), 'max is above min.')
  },
  swift(node, { emit, indent }) {
    const pad = ' '.repeat(indent)
    const props = node.props
    const value = (name, label = name) =>
      props[name] ? [`${label}: ${emit.value(props[name])}`] : []
    const args = [
      `label: ${emit.value(props.label)}`,
      `value: ${emit.value(props.value)}`,
      ...value('min', 'minimum'),
      ...value('max', 'maximum'),
      ...value('size'),
      ...value('strokeWidth'),
      ...value('semi'),
      ...value('animated'),
      ...value('animateNumber'),
      ...(props.color ? [`color: ${swiftColor(props.color, emit)}`] : []),
      ...value('suffix'),
      ...(props.formatValue ? [`format: ${emit.closure(props.formatValue.expr, 'String')}`] : []),
    ]
    return [
      `${pad}MavisGauge(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`,
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime: ({ theme, font, metric, motion }) => `${gaugeGeometry}

/// MGauge: the track, the arc over it, the number and the label, as createGauge in the Mavis
/// core builds them. It is one element named by the label, whose value is the number shown.
/// Jolt moves the end of the arc when the value changes; Reduce Motion puts it there. A range
/// the Web rejects draws the track alone.
struct MavisGauge: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let value: Double
    var minimum: Double = 0
    var maximum: Double = 100
    var size: Double = 220
    var strokeWidth: Double = 7
    var semi: Bool = false
    var animated: Bool = true
    var animateNumber: Bool = false
    var color: Color? = nil
    var suffix: String = ""
    var format: ((Double) -> String)? = nil

    private func dial(_ ratio: Double) -> some View {
        MavisPlotBox(side: Swift.max(80, size), ratio: semi ? 0.58 : 1) {
            GeometryReader { proxy in
                let width = Swift.min(18, Swift.max(0, strokeWidth)) * Double(proxy.size.width) / 100
                let outline: MavisOutline = semi ? .half : .ring
                ZStack {
                    MavisStretch(outline: outline, from: 0, to: 1)
                        .stroke(MavisTokens.border, style: StrokeStyle(lineWidth: width, lineCap: .round))
                    MavisStretch(outline: outline, from: 0, to: ratio)
                        .stroke(color.map { AnyShapeStyle($0) } ?? AnyShapeStyle(MavisTokens.primary), style: StrokeStyle(lineWidth: width, lineCap: .round))
                        .joltLayout(value: animated ? ratio : 0, transition: ${motion('data', 'mavisDataMotion')})
                }
            }
        }
    }

    var body: some View {
        let geometry = mavisGaugeGeometry(value, min: minimum, max: maximum)
        let shown = geometry?.value ?? (value.isFinite ? value : 0)
        MavisColumn(spacing: ${metric('space.sm')}, align: .center) {
            dial(geometry?.ratio ?? 0)
            MavisChartNumber(value: shown, roll: animateNumber && animated) { number in
                (format?(number) ?? mavisString(mavisRound(number * 100) / 100)) + suffix
            }
            Text(verbatim: label)
                .font(${font('caption')})
                .foregroundStyle(MavisTokens.text)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(verbatim: label))
        .accessibilityValue(Text(verbatim: (format?(shown) ?? mavisString(shown)) + suffix))
    }
}`,
}
