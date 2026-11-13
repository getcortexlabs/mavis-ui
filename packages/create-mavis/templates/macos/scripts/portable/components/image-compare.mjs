// MImageCompare: two pictures in one frame and a divider that reveals one over the other.
import { source } from './assets.mjs'
import { flexRuntime } from './flex.mjs'
import { pictureRuntime } from './image.mjs'
import { motionRuntime } from './motion.mjs'
import { flexItem } from './shared.mjs'

// A number the Web and NativeScript refuse unless it is positive.
const positive =
  (name) =>
  ({ attribute, value, ctx, expr, fail, T }) => {
    const number = expr(value, ctx, T.number)
    if (number.e === 'lit' && !(number.value > 0 && Number.isFinite(number.value)))
      fail(attribute, `${name} is a positive number.`)
    return { expr: number }
  }

// imageCompareProps. value and onChange are the contract's modelValue: how much of the frame
// shows the picture before, from 0 to 100.
export const MImageCompare = {
  props: {
    label: 'string',
    before: source,
    after: source,
    beforeLabel: 'string',
    afterLabel: 'string',
    value: 'number',
    onChange: 'number-handler',
    step: positive('step'),
    aspectRatio: positive('aspectRatio'),
    orientation: 'string',
    disabled: 'boolean',
  },
  required: ['label', 'before', 'after', 'value', 'onChange'],
  control: true,
  uses: [flexRuntime, pictureRuntime, motionRuntime],
  declaration:
    'declare function MImageCompare(props: { label: string; before: string; after: string; beforeLabel?: string; afterLabel?: string; value: number; onChange: (value: number) => void; step?: number; aspectRatio?: number; orientation?: MavisOrientation; disabled?: boolean }): JSX.Element',
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const args = [
      ...['label', 'before', 'after'].map((name) => `${name}: ${emit.value(props[name])}`),
      `value: ${emit.expr(props.value.expr)}`,
      `onChange: ${emit.handler(props.onChange, indent + 4)}`,
      ...['beforeLabel', 'afterLabel', 'step', 'aspectRatio']
        .filter((name) => props[name])
        .map((name) => `${name}: ${emit.value(props[name])}`),
      ...(props.orientation
        ? [
            `vertical: ${'lit' in props.orientation ? props.orientation.lit === 'vertical' : `${emit.expr(props.orientation.expr)} == "vertical"`}`,
          ]
        : []),
      ...(props.disabled ? [`disabled: ${emit.value(props.disabled)}`] : []),
    ]
    return [
      `${pad}MavisImageCompare(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`,
      ...flexItem({ width: { lit: '100%' } }, context),
    ].join('\n')
  },
  swiftRuntime:
    () => `/// MImageCompare: the picture after fills the frame and the picture before shows over it up to
/// the divider, both at their full size. The pointer puts the divider where it is pressed and
/// dragged, the arrow keys move it by a step, and a value that changes from outside travels
/// there through Jolt.
struct MavisImageCompare: View {
    let label: String
    let before: String
    let after: String
    let value: Double
    let onChange: (Double) -> Void
    var beforeLabel: String = "Before"
    var afterLabel: String = "After"
    var step: Double = 1
    var aspectRatio: Double = 1.5
    var vertical: Bool = false
    var disabled: Bool = false
    @StateObject private var shown = try! JoltMotionValue(50)
    @State private var origin: Double?
    @State private var placed = false
    @FocusState private var focused: Bool

    private static let settle = (try? JoltTransition.spring(milliseconds: 340, bounce: 0.08)) ?? .spring(.smooth)

    private var current: Double { Swift.min(100, Swift.max(0, value.isFinite ? value : 0)) }

    /// usePartition in the Mavis core: whole steps from 0, in range, asked for when they change it.
    private func update(_ wanted: Double) {
        guard !disabled, step > 0, wanted.isFinite else { return }
        let next = Swift.min(100, Swift.max(0, mavisRound(wanted / step) * step))
        if next != current { onChange((next * 100_000_000).rounded() / 100_000_000) }
    }

    private func cancel() {
        guard let start = origin else { return }
        origin = nil
        onChange(start)
    }

    private func drag(_ size: CGSize) -> some Gesture {
        DragGesture(minimumDistance: 0)
            .onChanged { gesture in
                guard !disabled else { return }
                if origin == nil {
                    origin = current
                    focused = true
                }
                let length = Double(vertical ? size.height : size.width)
                guard length > 0 else { return }
                let position = Double(vertical ? gesture.location.y : gesture.location.x)
                update(position / length * 100)
            }
            .onEnded { _ in origin = nil }
    }

    private func key(_ press: KeyPress) -> KeyPress.Result {
        guard !disabled, press.modifiers.isDisjoint(with: [.option, .control, .command]) else { return .ignored }
        let far: Double = press.modifiers.contains(.shift) ? 10 : 1
        switch press.key {
        case .rightArrow, .downArrow: update(current + step * far)
        case .leftArrow, .upArrow: update(current - step * far)
        case .home: update(0)
        case .end: update(100)
        case .pageUp: update(current + 10)
        case .pageDown: update(current - 10)
        case .escape: cancel()
        default: return .ignored
        }
        return .handled
    }

    private func chip(_ text: String) -> some View {
        Text(verbatim: text)
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(MavisTokens.text)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: 8))
            .padding(14)
            .allowsHitTesting(false)
    }

    private var handle: some View {
        Text(verbatim: vertical ? "↕" : "↔")
            .font(.system(size: 22))
            .foregroundStyle(MavisTokens.text)
            .frame(width: 42, height: 42)
            .background(MavisTokens.surface, in: Circle())
            .shadow(color: .black.opacity(0.25), radius: 12, y: 4)
            .accessibilityHidden(true)
    }

    private func frame(_ size: CGSize) -> some View {
        let share = Swift.min(1, Swift.max(0, shown.value / 100))
        let reveal = CGSize(width: vertical ? size.width : size.width * share, height: vertical ? size.height * share : size.height)
        return ZStack(alignment: .topLeading) {
            MavisImage(src: after, alt: afterLabel, aspectRatio: nil, radius: 0)
            MavisImage(src: before, alt: beforeLabel, aspectRatio: nil, radius: 0)
                .mask(alignment: .topLeading) { Rectangle().frame(width: reveal.width, height: reveal.height) }
            chip(beforeLabel)
            chip(afterLabel)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: vertical ? .bottomTrailing : .topTrailing)
            Rectangle()
                .fill(.white)
                .frame(width: vertical ? nil : 2, height: vertical ? 2 : nil)
                .overlay(Rectangle().stroke(.black.opacity(0.13), lineWidth: 1))
                .overlay { handle }
                .offset(x: vertical ? 0 : reveal.width - 1, y: vertical ? reveal.height - 1 : 0)
                .allowsHitTesting(false)
        }
        .frame(width: size.width, height: size.height, alignment: .topLeading)
        .contentShape(Rectangle())
        .gesture(drag(size))
    }

    var body: some View {
        MavisMotionReader { moves in
            VStack(alignment: .leading, spacing: 10) {
                GeometryReader { proxy in frame(proxy.size) }
                    .aspectRatio(aspectRatio > 0 && aspectRatio.isFinite ? aspectRatio : 1.5, contentMode: .fit)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .focusable(!disabled, interactions: .edit)
                    .focused($focused)
                    .onKeyPress(action: key)
                    .accessibilityElement(children: .contain)
                    .accessibilityLabel(Text(verbatim: label))
                    .accessibilityValue(Text(verbatim: beforeLabel + ": " + mavisString(mavisRound(current)) + "%"))
                    .accessibilityAdjustableAction { direction in
                        switch direction {
                        case .increment: update(current + step)
                        case .decrement: update(current - step)
                        @unknown default: break
                        }
                    }
                Text(verbatim: label + " · " + mavisString(mavisRound(current)) + "%")
                    .font(.system(size: 13))
                    .foregroundStyle(MavisTokens.muted)
            }
            // The divider follows a drag as it is; any other change travels there.
            .onChange(of: current, initial: true) { _, next in
                if placed, moves, origin == nil {
                    try? shown.animate(to: next, transition: Self.settle)
                } else {
                    try? shown.set(next)
                }
                placed = true
            }
            .onChange(of: moves) { _, next in if !next { try? shown.set(current) } }
        }
        .onChange(of: disabled) { _, next in if next { cancel() } }
        .onChange(of: vertical) { _, _ in cancel() }
    }
}`,
  vue: {
    rename: { value: 'modelValue', onChange: 'update:modelValue' },
  },
}
