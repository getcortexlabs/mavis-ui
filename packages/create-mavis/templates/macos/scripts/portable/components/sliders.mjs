import { flexRuntime } from './flex.mjs'
import {
  bounded,
  control,
  controlProps,
  controlTypes,
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
