// MGradientBackground: Jolt's gradient behind layers of content, as on the Web and NativeScript.
import { swiftNumber, swiftString } from '../swift-text.mjs'
import { MBox } from './box.mjs'
import { flexRuntime } from './flex.mjs'
import { motionRuntime } from './motion.mjs'
import { flexItem, union } from './shared.mjs'

// The defaults and the limits of the Mavis core (gradientBackgroundProps, effectColors).
const palette = ['#9C5270', '#51847B', '#D5AD6C']
const limits = { height: [40, 1600], duration: [1000, 120000], angle: [-36000, 36000] }
const hex = /^#[\da-f]{6}$/i
const count = 'colors takes 2 to 8 colors, each six hex digits such as "#9C5270".'

function colors({ attribute, value, ctx, expr, fail, ts, T }) {
  if (ts.isArrayLiteralExpression(value)) {
    const items = value.elements
    if (items.length < 2 || items.length > 8) fail(attribute, count)
    for (const item of items)
      if (ts.isStringLiteral(item) && !hex.test(item.text))
        fail(item, `${item.text} is not six hex digits. ${count}`)
  }
  return { expr: expr(value, ctx, T.array(T.string)) }
}

// A number the Web and NativeScript refuse outside its range.
const within =
  (name) =>
  ({ attribute, value, ctx, expr, fail, T }) => {
    const number = expr(value, ctx, T.number)
    const [least, most] = limits[name]
    if (number.e === 'lit' && !(number.value >= least && number.value <= most))
      fail(attribute, `${name} is between ${least} and ${most}.`)
    return { expr: number }
  }

// gradientBackgroundProps. Its content is layers, as an MBox's: the Web and NativeScript draw it
// with one.
export const MGradientBackground = {
  props: {
    id: 'string',
    colors,
    angle: within('angle'),
    animated: 'boolean',
    active: 'boolean',
    duration: within('duration'),
    height: within('height'),
    radius: 'string',
  },
  children: 'elements',
  uses: [flexRuntime, motionRuntime],
  declaration: `declare function MGradientBackground(props: { id?: string; colors?: readonly string[]; angle?: number; animated?: boolean; active?: boolean; duration?: number; height?: number; radius?: ${union(['none', 'sm', 'md', 'lg', 'full'])}; children?: unknown }): JSX.Element`,
  checkChildren: (source) => MBox.checkChildren(source),
  swift(node, context) {
    const { emit, indent, tokens } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const body =
      node.children.map((childNode) => emit.view(childNode, indent + 4, tokens)).join('\n') ||
      `${pad}    EmptyView()`
    const args = [
      ...['colors', 'angle', 'animated', 'active', 'duration', 'height']
        .filter((name) => props[name])
        .map((name) => `${name}: ${emit.expr(props[name].expr)}`),
      ...(props.radius
        ? [
            `radius: ${'lit' in props.radius ? tokens.radius(props.radius.lit) : tokens.scoped ? `mavisTheme.palette.metrics.corner(${emit.expr(props.radius.expr)})` : `MavisGradientModel.radius(${emit.expr(props.radius.expr)})`}`,
          ]
        : []),
    ]
    return [
      `${pad}MavisGradientBackground(${args.join(', ')}) {`,
      body,
      `${pad}}`,
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
      ...flexItem({ width: { lit: '100%' } }, context),
    ].join('\n')
  },
  swiftRuntime({ theme, metric, defaultMetric }) {
    const settle = theme.motion.enterDuration * 2.4
    return `/// What MGradientBackground paints: Jolt's gradient. Jolt blends the colors when the palette
/// changes and turns the angle while the background is active; nothing here keeps time.
@MainActor final class MavisGradientModel: ObservableObject {
    @Published private(set) var paint: JoltGradient?
    private let angle = try! JoltMotionValue(0)
    private var blend: JoltMotionValue?
    private var mixes: [JoltColorValue] = []
    private var shown: [JoltColor] = []
    private var turn = 0

    /// componentMotion(theme, "data") of the Mavis core.
    private static let settle = (try? JoltTransition.tween(milliseconds: ${swiftNumber(settle)}, ease: .${theme.motion.ease})) ?? .spring(.smooth)

    static func radius(_ name: String) -> Double {
        switch name {
${Object.entries(theme.radius)
  .map(([name, points]) => `        case ${swiftString(name)}: return ${points}`)
  .join('\n')}
        default: return ${metric('radius.lg')}
        }
    }

    /// effectColors of the Mavis core: 2 to 8 colors of six hex digits. Anything else is the default palette.
    static func colors(_ list: [String]) -> [JoltColor] {
        let parsed = list.compactMap { text -> JoltColor? in
            guard text.count == 7, text.hasPrefix("#"), let value = UInt32(text.dropFirst(), radix: 16) else { return nil }
            return JoltColor(argb: 0xFF00_0000 | value)
        }
        return parsed.count == list.count && (2...8).contains(parsed.count) ? parsed : colors(${JSON.stringify(palette)})
    }

    /// The palette, the angle and whether the angle turns. Without moves the gradient is set at
    /// once: under reduced motion, with animated off and in a window that is not on screen.
    func show(_ next: [JoltColor], angle wanted: Double, turning: Bool, duration: Double, moves: Bool) {
        turn += 1
        let token = turn
        let first = paint == nil
        let before = mixes.count == next.count ? mixes.map(\\.value) : shown
        release()
        if moves, !first, before.count == next.count, before != next, let progress = try? JoltMotionValue(0) {
            mixes = zip(before, next).compactMap { try? JoltColorValue(progress, from: $0, to: $1) }
            blend = progress
            try? progress.animate(to: 1, transition: Self.settle)
        }
        let sources: [JoltColorSource] = mixes.count == next.count ? mixes.map { .value($0) } : next.map { .constant($0) }
        shown = next
        // Jolt's gradient keeps the number of colors it was made with.
        if let paint, paint.frame.colors.count == next.count {
            try? paint.update(colors: sources)
        } else {
            paint?.dispose()
            try? angle.set(wanted)
            paint = try? JoltGradient(colors: sources, angle: .value(angle))
        }
        if moves && turning {
            spin(from: angle.value, quarter: duration / 2, token: token)
        } else if moves && !first {
            try? angle.animate(to: wanted, transition: Self.settle)
        } else {
            try? angle.set(wanted)
        }
    }

    // A half turn every duration, at a steady pace. Jolt's tweens last a minute at most, so the
    // half turn is two quarters.
    private func spin(from start: Double, quarter: Double, token: Int) {
        guard token == turn, let steady = try? JoltTransition.cubicBezier(milliseconds: quarter, points: [0, 0, 1, 1]) else { return }
        try? angle.animate(to: start + 90, transition: steady) { [weak self] finished in
            if finished { self?.spin(from: start + 90, quarter: quarter, token: token) }
        }
    }

    private func release() {
        for mix in mixes { mix.dispose() }
        mixes = []
        blend?.dispose()
        blend = nil
    }

    /// Off screen nothing turns.
    func rest() {
        turn += 1
        angle.cancel()
    }
}

/// MGradientBackground: layers of content over the gradient, as wide as it is offered and as
/// tall as height. Static unless active; a new palette or angle settles through Jolt.
struct MavisGradientBackground<Content: View>: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    var colors: [String] = ${JSON.stringify(palette)}
    var angle: Double = 130
    var animated: Bool = true
    var active: Bool = false
    var duration: Double = 12000
    var height: Double = 280
${defaultMetric('radius', 'radius.lg')}
    @ViewBuilder var content: () -> Content

    var body: some View {
        MavisMotionReader { moves in
            MavisGradientSurface(colors: MavisGradientModel.colors(colors), angle: angle, active: active, duration: min(${limits.duration[1]}, max(${limits.duration[0]}, duration)), radius: radius, moves: animated && moves) {
                MavisLayers { content() }
            }
        }
        .frame(height: min(${limits.height[1]}, max(${limits.height[0]}, height)))
    }
}

private struct MavisGradientSurface<Content: View>: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let colors: [JoltColor]
    let angle: Double
    let active: Bool
    let duration: Double
    let radius: Double
    let moves: Bool
    @ViewBuilder var content: () -> Content
    @StateObject private var model = MavisGradientModel()

    private var shape: RoundedRectangle { RoundedRectangle(cornerRadius: max(0, radius)) }

    private func show() {
        model.show(colors, angle: angle, turning: active, duration: duration, moves: moves)
    }

    var body: some View {
        content()
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background {
                if let paint = model.paint {
                    Color.clear.joltGradient(paint, in: shape)
                } else {
                    shape.fill(colors[0].swiftUIColor)
                }
            }
            .clipShape(shape)
            .onAppear { show() }
            .onChange(of: colors) { _, _ in show() }
            .onChange(of: [angle, duration]) { _, _ in show() }
            .onChange(of: [active, moves]) { _, _ in show() }
            .onDisappear { model.rest() }
    }
}`
  },
}
