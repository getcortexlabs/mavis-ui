// MDonutChart: shares of a whole as a ring, with the legend that selects one of them.
import { expression, handlerJs, js } from '../js-text.mjs'
import { bounded, chartRuntime, formatter, records, swiftRecords } from './chart-kit.mjs'
import { flexRuntime } from './flex.mjs'

/** donutGeometry of the Mavis core, without any view. */
export const donutGeometry = `/// One share of an MDonutChart, whatever record the source keeps it in.
struct MavisDonutSegment: Hashable {
    let id: String
    let label: String
    let value: Double
    let color: String?
}

/// A segment's share of the total, and where it starts and ends around the ring.
struct MavisDonutSlice: Equatable {
    let index: Int
    let segment: MavisDonutSegment
    let ratio: Double
    let start: Double
    let end: Double
}

/// donutGeometry in the Mavis core: the total and each segment's stretch of the ring, in order
/// from the top. Nil for data the core function rejects.
func mavisDonutGeometry(_ segments: [MavisDonutSegment]) -> (total: Double, slices: [MavisDonutSlice])? {
    guard mavisDistinct(segments.map(\\.id)), segments.count <= 24 else { return nil }
    var total = 0.0
    for segment in segments {
        guard !mavisTrim(segment.label).isEmpty, segment.value.isFinite, segment.value >= 0 else { return nil }
        if let color = segment.color, !color.isEmpty, !mavisIsHex(color) { return nil }
        total += segment.value
    }
    guard total.isFinite else { return nil }
    var offset = 0.0
    var slices: [MavisDonutSlice] = []
    for (index, segment) in segments.enumerated() {
        let ratio = total != 0 ? segment.value / total : 0
        let start = offset
        offset = Swift.min(1, offset + ratio)
        slices.append(MavisDonutSlice(index: index, segment: segment, ratio: ratio, start: start, end: offset))
    }
    return (total, slices)
}`

// donutChartProps. The selected segment is the source's: value is its id, or nothing, and
// onChange asks for another when a legend button is pressed.
export const MDonutChart = {
  props: {
    id: 'string',
    label: 'string',
    segments: records('MDonutChart', '{ id: string; label: string; value: number }', [
      ['id', 'string'],
      ['label', 'string'],
      ['value', 'number'],
      ['color', 'string', false],
    ]),
    value: 'optional-string',
    onChange: 'optional-string-handler',
    size: bounded((value) => value >= 100 && value <= 800, 'is from 100 to 800.'),
    strokeWidth: bounded((value) => value >= 1 && value <= 20, 'is from 1 to 20.'),
    animated: 'boolean',
    animateNumber: 'boolean',
    disabled: 'boolean',
    totalLabel: 'string',
    emptyLabel: 'string',
    formatValue: formatter,
  },
  required: ['label', 'segments'],
  control: true,
  handlers: { 'optional-string-handler': ({ T }) => [T.optional(T.string)] },
  uses: [flexRuntime, chartRuntime],
  types: () => `/** One share of an MDonutChart; color is a six-digit hex, or the chart's own. */
type DonutSegment = { id: string; label: string; value: number; color?: string }`,
  records: { DonutSegment: 'the Mavis donut segment type' },
  declaration:
    'declare function MDonutChart(props: { id?: string; label: string; segments: readonly DonutSegment[]; value?: string | null; onChange?: (value: string | null) => void; size?: number; strokeWidth?: number; animated?: boolean; animateNumber?: boolean; disabled?: boolean; totalLabel?: string; emptyLabel?: string; formatValue?: (value: number) => string }): JSX.Element',
  check({ props, attrs, fail }) {
    if (props.segments.fields.value.optional)
      fail(
        attrs.get('segments'),
        'Every segment of MDonutChart has a value: a number, zero or more.',
      )
  },
  swift(node, { emit, indent }) {
    const pad = ' '.repeat(indent)
    const props = node.props
    const value = (name, label = name) =>
      props[name] ? [`${label}: ${emit.value(props[name])}`] : []
    const args = [
      `label: ${emit.value(props.label)}`,
      `segments: ${swiftRecords(props.segments, emit, 'MavisDonutSegment', [
        ['id', 'id'],
        ['label', 'label'],
        ['value', 'value'],
        ['color', 'color'],
      ])}`,
      ...value('value'),
      ...(props.onChange ? [`onChange: ${emit.handler(props.onChange, indent + 4)}`] : []),
      ...value('size'),
      ...value('strokeWidth'),
      ...value('animated'),
      ...value('animateNumber'),
      ...value('disabled'),
      ...value('totalLabel'),
      ...value('emptyLabel'),
      ...(props.formatValue ? [`format: ${emit.closure(props.formatValue.expr, 'String')}`] : []),
    ]
    return [
      `${pad}MavisDonutChart(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`,
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime: ({ theme, font }) => `${donutGeometry}

/// MDonutChart: the ring, the number in its middle and a legend button for each segment, as
/// createDonutChart in the Mavis core builds them. The selection belongs to the source: a button
/// asks for its segment, or for none when it is the one selected. Jolt sweeps each segment in
/// and moves it when the shares change. Data the Web rejects shows as no data here.
struct MavisDonutChart: View {
    let label: String
    let segments: [MavisDonutSegment]
    var value: String? = nil
    var onChange: (String?) -> Void = { _ in }
    var size: Double = 220
    var strokeWidth: Double = 12
    var animated: Bool = true
    var animateNumber: Bool = false
    var disabled: Bool = false
    var totalLabel: String = "Total"
    var emptyLabel: String = "No data"
    var format: ((Double) -> String)? = nil

    private static let palette = ["#51847B", "#BF733E", "#6366A4", "#B75959", "#527F9C"]

    private func text(_ value: Double) -> String {
        format?(value) ?? mavisString(mavisRound(value * 100) / 100)
    }

    private func style(_ slice: MavisDonutSlice) -> AnyShapeStyle {
        if let color = mavisHexColor(slice.segment.color) { return AnyShapeStyle(color) }
        let place = slice.index % (Self.palette.count + 1)
        return place == 0 ? AnyShapeStyle(MavisTokens.primary) : AnyShapeStyle(mavisColor(Self.palette[place - 1]))
    }

    private func ring(_ slices: [MavisDonutSlice], total: Double, selected: MavisDonutSlice?) -> some View {
        MavisPlotBox(side: Swift.min(800, Swift.max(100, size))) {
            GeometryReader { proxy in
                let unit = Double(proxy.size.width) / 100
                let stroke = Swift.min(20, Swift.max(1, strokeWidth))
                ZStack {
                    MavisStretch(from: 0, to: 1)
                        .stroke(MavisTokens.border, style: StrokeStyle(lineWidth: stroke * unit, lineCap: .round))
                    ForEach(slices.filter { $0.ratio > 0 }, id: \\.segment.id) { slice in
                        let gap = Swift.min(slice.ratio / 4, 0.008)
                        MavisSweep(
                            from: slice.start + gap,
                            to: slice.end - gap,
                            style: style(slice),
                            width: (stroke + (selected?.segment.id == slice.segment.id ? 2 : 0)) * unit,
                            animated: animated
                        )
                        .opacity(selected != nil && selected?.segment.id != slice.segment.id ? 0.35 : 1)
                    }
                    VStack(spacing: 0) {
                        MavisChartNumber(value: selected?.segment.value ?? total, roll: animated && animateNumber, format: text)
                        Text(verbatim: selected?.segment.label ?? totalLabel)
                            .font(${font('caption')})
                            .foregroundStyle(MavisTokens.muted)
                            .multilineTextAlignment(.center)
                    }
                }
            }
        }
        .accessibilityHidden(true)
    }

    var body: some View {
        let geometry = mavisDonutGeometry(segments)
        let slices = geometry?.slices ?? []
        let total = geometry?.total ?? 0
        let selected = slices.first { $0.segment.id == value }
        MavisColumn(spacing: ${theme.space.md}) {
            Text(verbatim: label)
                .font(${font('heading')})
                .foregroundStyle(MavisTokens.text)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
            ring(slices, total: total, selected: selected)
            MavisChartCaption(text: totalLabel + ": " + text(total))
            if total == 0 {
                Text(verbatim: emptyLabel)
                    .font(${font('body')})
                    .foregroundStyle(MavisTokens.muted)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            ForEach(slices, id: \\.segment.id) { slice in
                let chosen = selected?.segment.id == slice.segment.id
                Button(action: { if !disabled { onChange(chosen ? nil : slice.segment.id) } }) {
                    HStack(spacing: 8) {
                        Circle().fill(style(slice)).frame(width: 10, height: 10)
                        Text(verbatim: slice.segment.label + " \\u{B7} " + text(slice.segment.value) + " \\u{B7} " + mavisString(mavisRound(slice.ratio * 100)) + "%")
                    }
                }
                .buttonStyle(MavisButtonStyle(variant: chosen ? .secondary : .ghost))
                .disabled(disabled)
                .accessibilityAddTraits(chosen ? .isSelected : [])
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}`,
  vue: {
    rename: { value: 'modelValue', onChange: 'update:modelValue' },
    types: ['DonutSegment'],
    attribute(name, value) {
      // Mavis reports no selection as null; the source's handler takes a missing value.
      if (name === 'onChange')
        return `@update:modelValue="${expression(`(next) => (${handlerJs(value)})(next ?? undefined)`)}"`
      if (name === 'value') return `:modelValue="${expression(`${js(value.expr)} ?? null`)}"`
    },
  },
}
