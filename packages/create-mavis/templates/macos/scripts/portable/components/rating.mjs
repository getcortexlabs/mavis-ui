import { flexRuntime } from './flex.mjs'
import { bounded, control, formatter, formatterSwift, given, inputRuntime } from './input-kit.mjs'
import { sliderRuntime } from './sliders.mjs'

const steps = [1, 0.5]

// Whole stars or halves: it decides whether the rating has a slider, so it is written out.
function step({ value, attribute, ctx, expr, fail, T }) {
  const number = expr(value, ctx, T.number)
  if (number.e !== 'lit' || !steps.includes(number.value))
    fail(attribute, 'step is written out: 1 for whole stars, 0.5 for halves.')
  return { expr: number }
}

// ratingProps: a value from 0 to max in stars, named by its label, with the value written beside
// it. The value belongs to the source: a star asks for its own number, and Clear for 0. With
// step 0.5 a slider under the stars asks for halves. A readonly rating only shows its stars.
export const MRating = {
  props: {
    id: 'string',
    label: 'string',
    value: 'number',
    onChange: 'number-handler',
    max: bounded(
      'max',
      (value) => Number.isInteger(value) && value >= 1 && value <= 10,
      'is a whole number from 1 to 10.',
    ),
    step,
    disabled: 'boolean',
    readonly: 'boolean',
    clearable: 'boolean',
    clearLabel: 'string',
    formatValue: formatter('formatValue', [
      { name: 'value', type: { k: 'number' } },
      { name: 'max', type: { k: 'number' } },
    ]),
  },
  required: ['label', 'value', 'onChange'],
  control: true,
  uses: [flexRuntime, inputRuntime, sliderRuntime],
  declaration:
    'declare function MRating(props: { id?: string; label: string; value: number; onChange: (value: number) => void; max?: number; step?: 1 | 0.5; disabled?: boolean; readonly?: boolean; clearable?: boolean; clearLabel?: string; formatValue?: (value: number, max: number) => string }): JSX.Element',
  swift(node, context) {
    const { emit, indent } = context
    const props = node.props
    return [
      control(node, context, 'MavisRating', [
        ...given(node, context, [
          'label',
          'value',
          'onChange',
          ['max', 'maximum'],
          'step',
          'disabled',
          'readonly',
          'clearable',
          'clearLabel',
        ]),
        ...(props.formatValue ? [`formatValue: ${formatterSwift(props.formatValue, emit)}`] : []),
      ]),
      ...(props.id ? [`${' '.repeat(indent + 4)}.mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime({ theme, font }) {
    const body = theme.typography.body
    const button = theme.components.button
    const radius = typeof button.radius === 'number' ? button.radius : theme.radius[button.radius]
    const height = theme.control.md.height
    return `/// MRating: the label and the value written out, a row of stars, a slider for halves and a
/// button that clears it. The value belongs to the source and is kept on whole steps from 0 to
/// max (ratingValue in the Mavis core). Jolt turns and grows a star when it lights up.
struct MavisRating: View {
    let label: String
    let value: Double
    let onChange: (Double) -> Void
    var maximum: Double = 5
    var step: Double = 1
    var disabled: Bool = false
    var readonly: Bool = false
    var clearable: Bool = true
    var clearLabel: String = "Clear rating"
    var formatValue: (Double, Double) -> String = { value, most in mavisString(value) + " / " + mavisString(most) }

    private static let dim = try! JoltPose(scale: 0.9, rotate: -8)

    // The Web refuses a max that is not a whole number from 1 to 10; the Mac keeps it there.
    private var count: Int { maximum.isFinite ? Swift.min(10, Swift.max(1, Int(maximum))) : 5 }
    private var unit: Double { step == 0.5 ? 0.5 : 1 }
    private func rated(_ wanted: Double) -> Double {
        guard wanted.isFinite else { return 0 }
        return Swift.max(0, Swift.min(Double(count), mavisRound(wanted / unit) * unit))
    }
    private var current: Double { rated(value) }

    private func choose(_ next: Double) {
        guard !readonly, !disabled, next != current else { return }
        onChange(rated(next))
    }

    @ViewBuilder private func star(_ index: Int) -> some View {
        let filled = current >= Double(index)
        let halved = current > Double(index - 1) && !filled
        let lit = filled || halved
        if readonly {
            MavisIcon(halved ? "star-half" : "star", size: 28)
                .foregroundStyle(lit ? MavisTokens.primary : MavisTokens.muted)
                .joltMotion(to: lit ? .identity : Self.dim, transition: MavisChoiceMotion.feedback)
        } else {
            Button { choose(Double(index)) } label: { MavisIcon(halved ? "star-half" : "star", size: 20) }
                .buttonStyle(MavisRatingStar(lit: lit))
                .disabled(disabled)
                .joltMotion(to: lit ? .identity : Self.dim, transition: MavisChoiceMotion.feedback)
                .accessibilityLabel(Text(verbatim: label + ": " + formatValue(Double(index), Double(count))))
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ${theme.space.sm}) {
            HStack(alignment: .firstTextBaseline, spacing: ${theme.space.sm}) {
                Text(verbatim: label)
                    .font(.system(size: ${body.fontSize}, weight: .semibold))
                    .foregroundStyle(MavisTokens.text)
                Spacer(minLength: 0)
                Text(verbatim: formatValue(current, Double(count)))
                    .font(${font('caption')})
                    .foregroundStyle(MavisTokens.muted)
            }
            MavisRow(spacing: ${theme.space.xs}, wrap: true) {
                ForEach(1...count, id: \\.self) { index in star(index) }
            }
            if !readonly && step == 0.5 {
                MavisSlider(label: label, value: current, onChange: choose, minimum: 0, maximum: Double(count), step: 0.5, disabled: disabled)
            }
            if clearable && !readonly {
                Button { choose(0) } label: { Text(verbatim: clearLabel) }
                    .buttonStyle(MavisButtonStyle(variant: .ghost))
                    .disabled(disabled || current == 0)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// A star of MRating: a square button of the theme's control height, filled when it is lit.
private struct MavisRatingStar: ButtonStyle {
    let lit: Bool
    @Environment(\\.isEnabled) private var isEnabled
    private static let pressed = try! JoltPose(scale: ${theme.motion.pressScale})
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(lit ? MavisTokens.onPrimary : MavisTokens.text)
            .frame(width: ${height}, height: ${height})
            .background(lit ? MavisTokens.primary : MavisTokens.elevated, in: RoundedRectangle(cornerRadius: ${radius}))
            .contentShape(RoundedRectangle(cornerRadius: ${radius}))
            .opacity(isEnabled ? 1 : 0.45)
            .joltMotion(to: configuration.isPressed && isEnabled ? Self.pressed : .identity, transition: .spring(.snappy))
    }
}`
  },
  vue: { rename: { value: 'modelValue', onChange: 'update:modelValue' } },
}
