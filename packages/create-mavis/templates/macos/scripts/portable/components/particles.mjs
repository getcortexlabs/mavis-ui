import { MBox } from './box.mjs'
import { flexRuntime } from './flex.mjs'
import { motionRuntime } from './motion.mjs'
import { bounded } from './chart-kit.mjs'
import { event } from './choices.mjs'
import { motionToken, swiftMotionToken } from './text-effects.mjs'

const palette = ['#9C5270', '#51847B', '#D5AD6C']
const range = (min, max) =>
  bounded((n) => Number.isFinite(n) && n >= min && n <= max, `must be between ${min} and ${max}.`)
export function effectPalette({ value, ctx, expr, fail, ts, T }) {
  if (ts.isArrayLiteralExpression(value)) {
    if (value.elements.length < 2 || value.elements.length > 8)
      fail(value, 'Effects require 2–8 six-digit HEX colors.')
    for (const item of value.elements)
      if (ts.isStringLiteral(item) && !/^#[\da-f]{6}$/i.test(item.text))
        fail(item, 'Effects require 2–8 six-digit HEX colors.')
  }
  return { expr: expr(value, ctx, T.array(T.string)) }
}
const contents = (node, { emit, indent, tokens }) =>
  node.children.map((child) => emit.view(child, indent + 4, tokens)).join('\n') ||
  `${' '.repeat(indent + 4)}EmptyView()`
const paletteRuntime = {
  swiftRuntime: () => `private func mavisEffectColors(_ colors: [String]) -> [JoltColor] {
    precondition((2...8).contains(colors.count), "Effects require 2–8 six-digit HEX colors")
    return colors.map { color in
        precondition(color.count == 7 && color.hasPrefix("#") && UInt32(color.dropFirst(), radix: 16) != nil, "Effects require six-digit HEX colors")
        return JoltColor(argb: 0xFF00_0000 | UInt32(color.dropFirst(), radix: 16)!)
    }
}
@MainActor private final class MavisParticlesModel: ObservableObject {
    @Published var particles: JoltParticles?
    var width: Double = 0
    var height: Double = 0
    func resize(_ size: CGSize) {
        width = size.width; height = size.height
        if width > 0 && height > 0 { try? particles?.resize(width: width, height: height) }
    }
    func stop() { particles?.dispose(); particles = nil }
    func start(_ options: JoltParticleOptions, rate: Double, duration: Double) {
        stop()
        guard width > 0 && height > 0 else { return }
        let model = JoltParticles(options)
        try! model.resize(width: width, height: height)
        particles = model
        try! model.emit(rate: rate, duration: duration)
    }
}
private struct MavisParticlesLayer: View {
    @ObservedObject var model: MavisParticlesModel
    var body: some View {
        GeometryReader { geometry in
            Group { if let particles = model.particles { JoltParticlesView(particles) } }
                .onAppear { model.resize(geometry.size) }
                .onChange(of: geometry.size) { _, size in model.resize(size) }
        }.allowsHitTesting(false).accessibilityHidden(true)
    }
}`,
}

export const MConfetti = {
  props: {
    id: 'string',
    colors: effectPalette,
    trigger: motionToken,
    count: bounded(
      (n) => Number.isInteger(n) && n >= 1 && n <= 180,
      'must be an integer between 1 and 180.',
    ),
    disabled: 'boolean',
    onBurst: 'handler',
    onSkipped: event(({ T }) => [T.string], "'disabled' | 'reduced-motion' | 'unavailable'"),
  },
  children: 'elements',
  uses: [flexRuntime, motionRuntime, paletteRuntime],
  checkChildren: (source) => MBox.checkChildren(source),
  declaration: `declare function MConfetti(props: { id?: string; colors?: readonly string[]; trigger?: string | number; count?: number; disabled?: boolean; onBurst?: ()=>void; onSkipped?: (reason:'disabled'|'reduced-motion'|'unavailable')=>void; children?: unknown }): JSX.Element`,
  swift(node, context) {
    const { emit, indent } = context,
      p = node.props,
      pad = ' '.repeat(indent)
    const args = ['colors', 'count', 'disabled'].flatMap((name) =>
      p[name] ? [`${name}: ${emit.value(p[name])}`] : [],
    )
    if (p.trigger) args.push(`trigger: ${swiftMotionToken(p.trigger, emit)}`)
    for (const name of ['onBurst', 'onSkipped'])
      if (p[name]) args.push(`${name}: ${emit.handler(p[name], indent + 4)}`)
    return (
      `${pad}MavisConfetti(${args.join(', ')}) {\n${contents(node, context)}\n${pad}}` +
      (p.id ? `\n${pad}    .mavisIdentifier(${emit.value(p.id)})` : '')
    )
  },
  swiftRuntime: () => `struct MavisConfetti<Content: View>: View {
    var colors = ${JSON.stringify(palette)}
    var count: Double = 70
    var disabled = false
    var trigger = "number:0"
    var onBurst: () -> Void = {}
    var onSkipped: (String) -> Void = { _ in }
    @ViewBuilder var content: () -> Content
    @StateObject private var model = MavisParticlesModel()
    @Environment(\\.accessibilityReduceMotion) private var reduced
    @Environment(\\.mavisReduceMotion) private var asked
    private func burst(_ moving: Bool) {
        model.stop()
        let reason = disabled ? "disabled" : reduced || asked ? "reduced-motion" : !moving || model.width <= 0 || model.height <= 0 ? "unavailable" : nil
        if let reason { onSkipped(reason); return }
        let options = try! JoltParticleOptions(colors: mavisEffectColors(colors), lifetime: 2200, size: 8, velocity: 260, velocityRange: 100, angle: -90, spread: 100, gravity: 420, spinRange: 360, shape: .rectangle)
        model.start(options, rate: count * 5, duration: 200)
        onBurst()
    }
    var body: some View {
        let _ = precondition(count.isFinite && count.rounded() == count && (1...180).contains(count), "Invalid confetti count")
        let _ = mavisEffectColors(colors)
        MavisMotionReader { moving in
            MavisLayers { content() }
                .overlay { MavisParticlesLayer(model: model) }
                .onChange(of: trigger) { _, _ in burst(moving) }
                .onChange(of: disabled || !moving) { _, stop in if stop { model.stop() } }
                .onDisappear { model.stop() }
        }
    }
}`,
}

export const MParticleField = {
  props: {
    id: 'string',
    colors: effectPalette,
    height: range(40, 1600),
    radius: 'string',
    active: 'boolean',
    density: range(1, 60),
    speed: range(0, 300),
    lifetime: range(100, 5000),
    duration: range(100, 60000),
    size: range(1, 24),
    shape: 'string',
    backgroundColor: 'color',
  },
  children: 'elements',
  uses: [flexRuntime, motionRuntime, paletteRuntime],
  checkChildren: (source) => MBox.checkChildren(source),
  declaration: `declare function MParticleField(props:{id?:string;colors?:readonly string[];height?:number;radius?:'none'|'sm'|'md'|'lg'|'full';active?:boolean;density?:number;speed?:number;lifetime?:number;duration?:number;size?:number;shape?:'circle'|'rectangle'|'ring';backgroundColor?:string;children?:unknown}):JSX.Element`,
  check({ props, attrs, tag, fail }) {
    if (
      props.active &&
      !(props.active.expr.e === 'lit' && !props.active.expr.value) &&
      !props.duration
    )
      fail(
        attrs.get('active'),
        'Continuous MParticleField needs a continuous JoltSwiftUI emitter (#354). Supply a finite duration on the Mac; no timer-based replacement is generated.',
      )
    const duration = props.duration?.expr,
      lifetime = props.lifetime?.expr
    if (
      duration?.e === 'lit' &&
      (!lifetime || lifetime.e === 'lit') &&
      duration.value + (lifetime?.value ?? 3000) > 60000
    )
      fail(
        attrs.get('duration') ?? tag,
        'JoltSwiftUI requires particle duration plus lifetime to fit within 60000 ms (#354).',
      )
  },
  swift(node, context) {
    const { emit, indent, tokens } = context,
      p = node.props,
      pad = ' '.repeat(indent)
    const args = [
      'colors',
      'height',
      'active',
      'density',
      'speed',
      'lifetime',
      'duration',
      'size',
      'shape',
      'backgroundColor',
    ].flatMap((name) => (p[name] ? [`${name}: ${emit.value(p[name])}`] : []))
    if (p.radius)
      args.push(
        `radius: ${'lit' in p.radius ? tokens.radius(p.radius.lit) : `MavisGradientModel.radius(${emit.expr(p.radius.expr)})`}`,
      )
    return (
      `${pad}MavisParticleField(${args.join(', ')}) {\n${contents(node, context)}\n${pad}}` +
      (p.id ? `\n${pad}    .mavisIdentifier(${emit.value(p.id)})` : '')
    )
  },
  swiftRuntime: ({ defaultMetric }) => `struct MavisParticleField<Content: View>: View {
    var colors = ${JSON.stringify(palette)}
    var height: Double = 280
    var active = false
    var density: Double = 12
    var speed: Double = 28
    var lifetime: Double = 3000
    var duration: Double? = nil
    var size: Double = 3
    var shape = "circle"
    var backgroundColor = "#202A32"
    ${defaultMetric('radius', 'radius.lg')}
    @ViewBuilder var content: () -> Content
    @StateObject private var model = MavisParticlesModel()
    private func update(_ moving: Bool) {
        model.stop()
        guard moving && active else { return }
        guard let duration else { preconditionFailure("Continuous particles require a continuous JoltSwiftUI emitter") }
        let options = try! JoltParticleOptions(colors: mavisEffectColors(colors), lifetime: lifetime, size: size, velocity: speed, angle: -90, spread: 80, shape: shape == "ring" ? .ring : shape == "rectangle" ? .rectangle : .circle, source: .bottom)
        model.start(options, rate: density, duration: duration)
    }
    var body: some View {
        let _ = precondition(height.isFinite && (40...1600).contains(height) && density.isFinite && (1...60).contains(density) && speed.isFinite && (0...300).contains(speed) && lifetime.isFinite && (100...5000).contains(lifetime) && size.isFinite && (1...24).contains(size) && ["circle","rectangle","ring"].contains(shape), "Invalid MParticleField options")
        let _ = precondition(duration == nil || (duration!.isFinite && duration! >= 100 && duration! + lifetime <= 60000), "JoltSwiftUI particle duration plus lifetime must fit within 60000 ms")
        let _ = mavisEffectColors(colors)
        MavisMotionReader { moving in
            MavisLayers { content() }
                .frame(maxWidth: .infinity).frame(height: height)
                .background(mavisColor(backgroundColor))
                .overlay { MavisParticlesLayer(model: model) }
                .clipShape(RoundedRectangle(cornerRadius: radius))
                .onAppear { update(moving) }
                .onChange(of: [String(active), String(moving), String(density), String(speed), String(lifetime), String(duration ?? -1), String(size), shape] + colors) { _, _ in update(moving) }
                .onDisappear { model.stop() }
        }
    }
}`,
}
