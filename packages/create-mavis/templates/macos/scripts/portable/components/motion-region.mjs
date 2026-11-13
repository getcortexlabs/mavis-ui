import {
  motionRegionType,
  motionTimelineType,
  motionRegionOpen,
  motionRegionMember,
  motionRegionCall,
  motionRegionReadCall,
  whenMotionCall,
} from '../frontends/motion-region.mjs'
import {
  motionSurfaceComposable,
  motionOptionsSwift,
  motionFramesSwift,
} from './motion-surface.mjs'
export { motionRegionReference } from '../frontends/motion-region.mjs'
export const motionRegionTypes = `interface MotionTimeline extends MotionPlayback { readonly paused:boolean; readonly duration:number|undefined; pause():void; resume():void }
interface MotionRegion { readonly available:boolean; onAvailable(setup:()=>void|(()=>void)):()=>void; timeline(steps:unknown):MotionTimeline; sequence(steps:unknown):MotionPlayback }`
function groupCall(emit, value, owner = 'self', indent = 0) {
  const target = `${owner}.${value.ref}`
  if (value.method === 'onAvailable')
    return `${target}.onAvailable(${emit.ownedCallback(value.callback, indent)})`
  const steps = value.args[0].items.map((step) => {
    const [surface, frames, options] = step.items
    const at = options?.fields.find((field) => field.name === 'at')?.value
    const position = !at
      ? '.next'
      : at.type.k === 'number'
        ? `.absolute(${emit.expr(at)})`
        : at.value === '<'
          ? '.previous'
          : `.relative(${JSON.stringify(at.value)})`
    return `MavisMotionStep(surface: ${emit.expr(surface)}, frames: ${motionFramesSwift(emit, frames)}, options: ${motionOptionsSwift(emit, options)}, at: ${position})`
  })
  return `try ${target}.${value.method}([${steps.join(', ')}])`
}
export const motionRegionComposable = {
  ...motionSurfaceComposable,
  name: 'createMotionRegion',
  kind: 'motion-region',
  declaration: 'function createMotionRegion(): MotionRegion',
  valueType: motionRegionType,
  types: {
    MotionRegion: { type: motionRegionType },
    MotionTimeline: {
      ...motionSurfaceComposable.types.MotionControlledPlayback,
      type: motionTimelineType,
      member(context) {
        if (context.node.name.text === 'duration')
          context.reader.fail(
            context.node,
            'Reading the dynamically resolved timeline duration needs additional Mac support (#354).',
          )
        return motionSurfaceComposable.types.MotionControlledPlayback.member(context)
      },
    },
  },
  typeImports: { '@getcortexlabs/mavis-core/experimental': ['MotionRegion', 'MotionTimeline'] },
  open: motionRegionOpen,
  member: motionRegionMember,
  call: motionRegionCall,
  valueCall: motionRegionReadCall,
  swift: (name) => `@StateObject private var ${name}: MavisMotionRegion`,
  initialize: (ref) => `_${ref.name} = StateObject(wrappedValue: MavisMotionRegion())`,
  contextType: 'MavisMotionRegion',
  statement: (emit, value, indent, owner) =>
    `${' '.repeat(indent)}${value.method === 'onAvailable' ? '_ = ' : ''}${groupCall(emit, value, owner, indent)}`,
  expression: groupCall,
  vue: (ref) => ({
    imports: { '@getcortexlabs/mavis-core/experimental': ['createMotionRegion'] },
    setup: [`const ${ref.name} = createMotionRegion()`],
  }),
  unused: (name) => `${name} needs a view with motionRegion to own its presentation.`,
}
export const motionRegionRuntime = {
  swiftRuntime: () => `enum MavisMotionPosition {
    case next, previous, absolute(Double), relative(String)
    func resolve(end: Double, previous: Double) throws -> Double {
        let result: Double
        switch self {
        case .next: result = end
        case .previous: result = previous
        case .absolute(let value): result = value
        case .relative(let value):
            guard value.first == "+", let offset = Double(value.dropFirst()), offset >= 0 else { throw MavisMotionFailure.invalidOptions }
            result = end + offset
        }
        guard result.isFinite, result >= previous, result <= 60000 else { throw MavisMotionFailure.invalidOptions }
        return result
    }
}
@MainActor struct MavisMotionStep {
    let surface: MavisMotionSurface
    let frames: [String: [Double?]]
    var options = MavisMotionOptions()
    var at = MavisMotionPosition.next
}
@MainActor final class MavisMotionRegion: MavisMotionPresentation {
    @discardableResult func timeline(_ steps: [MavisMotionStep]) throws -> MavisMotionPlayback {
        try refresh()
        var tracks: [JoltTimelineTrack] = []
        var endpoints: [ObjectIdentifier: Double] = [:]
        var end = 0.0, previous = 0.0
        for step in steps {
            let start = try step.at.resolve(end: end, previous: previous)
            let stage = try step.surface.tracks(step.frames, options: step.options).map { track in
                JoltTimelineTrack(track.value, to: track.to, from: track.from ?? endpoints[ObjectIdentifier(track.value)] ?? track.value.value, at: track.at, transition: track.transition)
            }
            let probe = try JoltTimeline(tracks: stage, autoplay: false)
            let duration = probe.duration
            probe.dispose()
            for track in stage {
                tracks.append(JoltTimelineTrack(track.value, to: track.to, from: track.from, at: start + track.at, transition: track.transition))
                endpoints[ObjectIdentifier(track.value)] = track.to
            }
            previous = start
            end = start + duration
        }
        return try play(tracks, targets: steps.map(\\.surface))
    }
    @discardableResult func sequence(_ steps: [MavisMotionStep]) throws -> MavisMotionPlayback { try timeline(steps) }
}
private struct MavisMotionRegionBinding: ViewModifier {
    @ObservedObject var region: MavisMotionRegion
    @Environment(\\.accessibilityReduceMotion) private var reduced
    @Environment(\\.mavisReduceMotion) private var asked
    func body(content: Content) -> some View {
        MavisMotionReader { visible in
            content.background(MavisMotionSurfaceAnchor(surface: region))
                .onAppear { region.environment(reduced: reduced || asked, visible: visible) }
                .onChange(of: [visible, reduced, asked]) { _, _ in region.environment(reduced: reduced || asked, visible: visible) }
        }
    }
}
extension View {
    func mavisMotionRegion(_ region: MavisMotionRegion) -> some View { modifier(MavisMotionRegionBinding(region: region)) }
}`,
}

export const whenMotionComposable = {
  name: 'whenMotionAvailable',
  kind: 'motion-availability',
  standalone: true,
  module: '@getcortexlabs/mavis-core/experimental',
  declaration:
    'function whenMotionAvailable(sources:readonly (MotionSurface|MotionRegion)[],setup:()=>void|(()=>void)):()=>void',
  open: ({ call, fail }) =>
    fail(call, 'Subscribe to motion availability from onMounted or an action.'),
  call: whenMotionCall,
  valueCall: (ctx) => {
    const { s, ...value } = whenMotionCall(ctx)
    return { e: 'controller-call', ...value }
  },
  statement: (emit, value, indent) =>
    `${' '.repeat(indent)}_ = mavisWhenMotionAvailable(${emit.expr(value.args[0])}, ${emit.ownedCallback(value.callback, indent)})`,
  expression: (emit, value) =>
    `mavisWhenMotionAvailable(${emit.expr(value.args[0])}, ${emit.ownedCallback(value.callback, 8)})`,
  vue: () => ({
    imports: { '@getcortexlabs/mavis-core/experimental': ['whenMotionAvailable'] },
    setup: [],
  }),
}
