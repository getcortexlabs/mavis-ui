import { flexRuntime } from './flex.mjs'
import { expression, handlerJs, js } from '../js-text.mjs'
import {
  bounded,
  control,
  controlProps,
  controlTypes,
  formatter,
  formatterSwift,
  given,
  inputRuntime,
  number,
} from './input-kit.mjs'

const positive = (key) => bounded(key, (value) => value > 0, 'must be positive.')

// A literal range is checked while generating, as sliderScale checks it on the Web.
function range({ props, attrs, fail }) {
  const min = number(props, 'min', 0)
  const max = number(props, 'max', 100)
  if (min !== undefined && max !== undefined && min >= max)
    fail(attrs.get('min') ?? attrs.get('max'), 'min is below max.')
}

/** sliderScale of the Mavis core in Swift, for every control that steps through a range. */
export const sliderRuntime = {
  swiftRuntime:
    () => `/// sliderScale in the Mavis core: a range as whole steps from its minimum. The last step is
/// shorter when step does not divide the range, and a value past its middle goes to the maximum.
struct MavisSliderScale {
    let minimum: Double
    let maximum: Double
    let step: Double
    let steps: Double

    init(_ minimum: Double, _ maximum: Double, _ step: Double) {
        // The Web refuses a range it cannot step through; the Mac draws it as one step.
        let usable = minimum.isFinite && maximum.isFinite && minimum < maximum
        self.minimum = usable ? minimum : 0
        self.maximum = usable ? maximum : 1
        self.step = step.isFinite && step > 0 ? step : self.maximum - self.minimum
        let count = (self.maximum - self.minimum) / self.step
        let rounded = mavisRound(count)
        let tolerance = Double.ulpOfOne * Swift.max(1, count) * 4
        steps = Swift.max(1, abs(count - rounded) <= tolerance ? rounded : count.rounded(.up))
    }

    func toNative(_ value: Double) -> Double {
        guard value.isFinite else { return 0 }
        if value >= maximum { return steps }
        if value <= minimum { return 0 }
        let previous = minimum + (steps - 1) * step
        if value >= previous + (maximum - previous) / 2 { return steps }
        return Swift.min(steps - 1, Swift.max(0, mavisRound((value - minimum) / step)))
    }

    func fromNative(_ value: Double) -> Double {
        guard value.isFinite else { return minimum }
        let index = Swift.min(steps, Swift.max(0, mavisRound(value)))
        if index == steps { return maximum }
        let exact = minimum + index * step
        // Number(value.toPrecision(15)) in JavaScript.
        return Double(String(format: "%.14e", exact)) ?? exact
    }

    /// The value a step away from this one, as the arrow keys and VoiceOver ask for it.
    func snapped(_ value: Double) -> Double { fromNative(toNative(value)) }
}

/// The key a slider answers, as steps to move by: the arrows one step, Home and End the ends.
func mavisSliderKey(_ press: KeyPress, steps: Double, index: Double) -> Double? {
    guard press.modifiers.isDisjoint(with: [.option, .control, .command]) else { return nil }
    switch press.key {
    case .home: return 0
    case .end: return steps
    case .rightArrow, .upArrow: return index + 1
    case .leftArrow, .downArrow: return index - 1
    default: return nil
    }
}`,
}

// sliderProps: one value in a range, in whole steps. The value belongs to the source: the
// thumb, the arrow keys and assistive technology ask for another one.
export const MSlider = {
  props: {
    ...controlProps,
    label: 'string',
    value: 'number',
    onChange: 'number-handler',
    min: 'number',
    max: 'number',
    step: positive('step'),
    disabled: 'boolean',
  },
  required: ['label', 'value', 'onChange'],
  control: true,
  uses: [flexRuntime, inputRuntime, sliderRuntime],
  declaration: `declare function MSlider(props: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number; disabled?: boolean; ${controlTypes} }): JSX.Element`,
  check: range,
  swift: (node, context) =>
    control(
      node,
      context,
      'MavisSlider',
      given(node, context, [
        'label',
        'value',
        'onChange',
        ['min', 'minimum'],
        ['max', 'maximum'],
        'step',
        'disabled',
        'id',
      ]),
    ),
  swiftRuntime:
    () => `/// MSlider: a track filled up to a thumb, as wide as its stack. The value belongs to the
/// source; a drag, the arrow keys, Home and End ask for the value of another step.
struct MavisSlider: View {
    let label: String
    let value: Double
    let onChange: (Double) -> Void
    var minimum: Double = 0
    var maximum: Double = 100
    var step: Double = 1
    var disabled: Bool = false
    var id: String = ""
    @FocusState private var focused: Bool

    private var scale: MavisSliderScale { MavisSliderScale(minimum, maximum, step) }
    private var index: Double { scale.toNative(value) }

    private func ask(_ wanted: Double) {
        guard !disabled else { return }
        let next = scale.fromNative(wanted)
        if next != scale.fromNative(index) { onChange(next) }
    }

    var body: some View {
        GeometryReader { proxy in
            let width: Double = proxy.size.width
            let share: Double = index / scale.steps
            ZStack(alignment: .leading) {
                Capsule().fill(MavisTokens.muted).frame(height: 6)
                Capsule().fill(MavisTokens.primary).frame(width: width * share, height: 6)
                Circle()
                    .fill(MavisTokens.primary)
                    .frame(width: 20, height: 20)
                    .offset(x: Swift.max(0, width - 20) * share)
            }
            .frame(maxHeight: .infinity)
            .contentShape(Rectangle())
            .gesture(DragGesture(minimumDistance: 0).onChanged { gesture in
                focused = true
                ask(mavisRound((gesture.location.x - 10) / Swift.max(1, width - 20) * scale.steps))
            })
        }
        .frame(minWidth: 44, maxWidth: .infinity, minHeight: 44, maxHeight: 44)
        .opacity(disabled ? 0.45 : 1)
        .modifier(MavisFocusRing(focused: focused))
        .focusable(!disabled)
        .focusEffectDisabled()
        .focused($focused)
        .onKeyPress { press in
            guard let wanted = mavisSliderKey(press, steps: scale.steps, index: index) else { return .ignored }
            ask(wanted)
            return .handled
        }
        .accessibilityRepresentation {
            Slider(value: Binding(get: { index }, set: { ask($0) }), in: 0...scale.steps, step: 1) {
                Text(verbatim: label)
            }
            .disabled(disabled)
            .accessibilityValue(Text(verbatim: mavisString(scale.fromNative(index))))
            .accessibilityIdentifier(id)
        }
    }
}`,
  vue: { rename: { value: 'modelValue', onChange: 'update:modelValue' } },
}

// The pair of a range: two numbers, the lower first.
function pair({ value, attribute, ctx, expr, fail, T }) {
  const list = expr(value, ctx, T.array(T.number))
  if (list.e === 'array' && list.items.length !== 2)
    fail(attribute, 'A range is two values, the lower first: [20, 80].')
  const [low, high] = list.e === 'array' ? list.items : []
  if (low?.e === 'lit' && high?.e === 'lit' && low.value > high.value)
    fail(attribute, 'A range is two values, the lower first: [20, 80].')
  return { expr: list }
}

// rangeSliderProps: a lower and an upper value in one range, in whole steps. The pair belongs to
// the source: each thumb asks for the pair with its own value changed, and stops at the other
// thumb. formatValue writes a value for the summary beside the label.
export const MRangeSlider = {
  props: {
    ...controlProps,
    label: 'string',
    value: pair,
    onChange: 'numbers-handler',
    min: 'number',
    max: 'number',
    step: positive('step'),
    disabled: 'boolean',
    readonly: 'boolean',
    lowerLabel: 'string',
    upperLabel: 'string',
    formatValue: formatter('formatValue', [{ name: 'value', type: { k: 'number' } }]),
  },
  required: ['label', 'value', 'onChange'],
  control: true,
  uses: [flexRuntime, inputRuntime, sliderRuntime],
  declaration: `declare function MRangeSlider(props: { label: string; value: readonly [number, number]; onChange: (value: [number, number]) => void; min?: number; max?: number; step?: number; disabled?: boolean; readonly?: boolean; lowerLabel?: string; upperLabel?: string; formatValue?: (value: number) => string; ${controlTypes} }): JSX.Element`,
  check: range,
  swift(node, context) {
    const { emit, indent } = context
    const props = node.props
    return [
      control(node, context, 'MavisRangeSlider', [
        ...given(node, context, [
          'label',
          'value',
          'onChange',
          ['min', 'minimum'],
          ['max', 'maximum'],
          'step',
          'disabled',
          'readonly',
          'lowerLabel',
          'upperLabel',
        ]),
        ...(props.formatValue ? [`formatValue: ${formatterSwift(props.formatValue, emit)}`] : []),
      ]),
      ...(props.id ? [`${' '.repeat(indent + 4)}.mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime({ theme, font }) {
    const body = theme.typography.body
    return `/// MRangeSlider: the label and the range written out, over a track with two thumbs and the
/// part between them filled. The pair belongs to the source; a thumb asks for the pair with its
/// own value on another step, and never passes the other thumb (moveRange in the Mavis core).
struct MavisRangeSlider: View {
    let label: String
    let value: [Double]
    let onChange: ([Double]) -> Void
    var minimum: Double = 0
    var maximum: Double = 100
    var step: Double = 1
    var disabled: Bool = false
    var readonly: Bool = false
    var lowerLabel: String = "Minimum"
    var upperLabel: String = "Maximum"
    var formatValue: (Double) -> String = { mavisString($0) }
    @FocusState private var focus: Int?
    @State private var active: Int?

    private static let rest = try! JoltPose(scale: 0.65, opacity: 0)
    private static let held = try! JoltPose(scale: 1, opacity: 0.18)

    private var scale: MavisSliderScale { MavisSliderScale(minimum, maximum, step) }

    /// rangeValue in the Mavis core: both values on whole steps. The Web refuses a pair out of
    /// order; the Mac draws it in order.
    private var pair: [Double] {
        let low = value.first ?? minimum
        let high = value.count > 1 ? value[1] : maximum
        return [scale.snapped(Swift.min(low, high)), scale.snapped(Swift.max(low, high))]
    }

    private func index(_ thumb: Int) -> Double { scale.toNative(pair[thumb]) }

    private func move(_ thumb: Int, to wanted: Double) {
        guard !disabled, !readonly else { return }
        var next = pair
        let snapped = scale.fromNative(wanted)
        next[thumb] = thumb == 0 ? Swift.min(snapped, next[1]) : Swift.max(snapped, next[0])
        if next[thumb] != pair[thumb] { onChange(next) }
    }

    private func thumb(_ thumb: Int, travel: Double) -> some View {
        ZStack {
            Circle()
                .fill(MavisTokens.primary)
                .frame(width: 40, height: 40)
                .joltMotion(to: active == thumb && !disabled && !readonly ? Self.held : Self.rest, transition: MavisChoiceMotion.feedback)
            Circle().fill(MavisTokens.primary).frame(width: 26, height: 26)
            Circle().fill(MavisTokens.surface).frame(width: 24, height: 24)
            Circle().fill(MavisTokens.primary).frame(width: 18, height: 18)
        }
        .frame(width: 24, height: 48)
        .contentShape(Circle())
        .modifier(MavisFocusRing(focused: focus == thumb, radius: 8, offset: 2))
        .offset(x: travel * index(thumb) / scale.steps)
        .zIndex(thumb == 0 && index(0) == scale.steps ? 3 : Double(thumb + 1))
        .gesture(
            DragGesture(minimumDistance: 0, coordinateSpace: .named("mavis-range"))
                .onChanged { gesture in
                    guard !disabled, !readonly else { return }
                    active = thumb
                    focus = thumb
                    move(thumb, to: mavisRound((gesture.location.x - 12) / Swift.max(1, travel) * scale.steps))
                }
                .onEnded { _ in active = nil }
        )
        .focusable(!disabled)
        .focusEffectDisabled()
        .focused($focus, equals: thumb)
        .onKeyPress { press in
            guard !disabled, !readonly, let wanted = mavisSliderKey(press, steps: scale.steps, index: index(thumb)) else { return .ignored }
            move(thumb, to: wanted)
            return .handled
        }
        .accessibilityRepresentation {
            Slider(value: Binding(get: { index(thumb) }, set: { move(thumb, to: $0) }), in: 0...scale.steps, step: 1) {
                Text(verbatim: label + ": " + (thumb == 0 ? lowerLabel : upperLabel))
            }
            .disabled(disabled)
            .accessibilityValue(Text(verbatim: formatValue(pair[thumb])))
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ${theme.space.sm}) {
            HStack(alignment: .firstTextBaseline, spacing: ${theme.space.md}) {
                Text(verbatim: label)
                    .font(.system(size: ${body.fontSize}, weight: .semibold))
                    .foregroundStyle(MavisTokens.text)
                Spacer(minLength: 0)
                Text(verbatim: formatValue(pair[0]) + " \\u{2013} " + formatValue(pair[1]))
                    .font(${font('body')})
                    .foregroundStyle(MavisTokens.muted)
            }
            GeometryReader { proxy in
                let travel: Double = Swift.max(0, proxy.size.width - 24)
                ZStack(alignment: .leading) {
                    Capsule().fill(MavisTokens.border).frame(width: travel, height: 6).offset(x: 12)
                    Capsule()
                        .fill(MavisTokens.primary)
                        .frame(width: travel * (index(1) - index(0)) / scale.steps, height: 6)
                        .offset(x: 12 + travel * index(0) / scale.steps)
                    thumb(0, travel: travel)
                    thumb(1, travel: travel)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                .coordinateSpace(name: "mavis-range")
            }
            .frame(height: 48)
            .opacity(disabled ? 0.45 : 1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .onChange(of: disabled || readonly) { _, blocked in if blocked { active = nil } }
    }
}`
  },
  vue: {
    rename: { value: 'modelValue', onChange: 'update:modelValue' },
    // The Web and NativeScript take the pair as a tuple and hand it back read-only.
    attribute(name, value) {
      if (name === 'value')
        return `:modelValue="${expression(`${js(value.expr)} as [number, number]`)}"`
      if (name === 'onChange' && value.params.some((param) => !param.unused))
        return `@update:modelValue="${expression(`(pair) => (${handlerJs(value)})([...pair])`)}"`
    },
  },
}
