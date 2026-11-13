import { flexRuntime } from './flex.mjs'
import { motionRuntime } from './motion.mjs'
import { bounded, field, records } from './list-parts.mjs'
import { pictureRuntime } from './image.mjs'
import { bundleRuntime } from './assets.mjs'

const readItems = records(
  'MMarquee',
  'items',
  { label: 'string', image: 'string?' },
  '{ id: string | number; label: string }[]',
)
function items(context) {
  const result = readItems(context)
  const id = context.fields(result.record).find((field) => field.name === 'id')
  if (!id || !['string', 'number'].includes(id.type.k))
    context.fail(
      context.attribute,
      'Marquee items need a string or numeric id of one consistent type.',
    )
  return { ...result, keyType: id.type.k }
}
export const MMarquee = {
  props: {
    id: 'string',
    label: 'string',
    items,
    autoplay: 'boolean',
    paused: 'boolean',
    onUpdatePaused: 'boolean-handler',
    speed: bounded('speed', (n) => n > 0 && n <= 500, 'must be in (0, 500].'),
    itemWidth: bounded('itemWidth', (n) => n >= 80, 'must be at least 80.'),
    gap: bounded('gap', (n) => n >= 0, 'must be nonnegative.'),
    direction: 'string',
    playLabel: 'string',
    pauseLabel: 'string',
  },
  required: ['label', 'items'],
  control: true,
  uses: [flexRuntime, motionRuntime, bundleRuntime, pictureRuntime],
  types: () =>
    'type MarqueeItem<ID extends string | number = string> = { id: ID; label: string; image?: string }',
  records: { MarqueeItem: 'the Mavis marquee item type' },
  declaration: `declare function MMarquee<T extends {id:string|number;label:string;image?:string}>(props:{id?:string;label:string;items:readonly T[];autoplay?:boolean;paused?:boolean;onUpdatePaused?:(paused:boolean)=>void;speed?:number;itemWidth?:number;gap?:number;direction?:'left'|'right';playLabel?:string;pauseLabel?:string}):JSX.Element`,
  swift(node, { emit, indent }) {
    const p = node.props,
      pad = ' '.repeat(indent),
      rows = p.items
    const args = [
      `label: ${emit.value(p.label)}`,
      `items: ${emit.expr(rows.expr)}.map { MavisMarqueeItem(id: mavisMarqueeID($0.id), label: $0.label, image: ${field(rows.has, 'image', 'nil')}) }`,
    ]
    for (const name of [
      'autoplay',
      'paused',
      'speed',
      'itemWidth',
      'gap',
      'direction',
      'playLabel',
      'pauseLabel',
    ])
      if (p[name]) args.push(`${name}: ${emit.value(p[name])}`)
    if (p.onUpdatePaused) args.push(`onUpdatePaused: ${emit.handler(p.onUpdatePaused, indent + 4)}`)
    return `${pad}MavisMarquee(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})${p.id ? `\n${pad}    .mavisIdentifier(${emit.value(p.id)})` : ''}`
  },
  vue: { rename: { onUpdatePaused: 'update:paused' }, types: ['MarqueeItem'] },
  swiftRuntime: ({
    theme,
    font,
    metric,
  }) => `func mavisMarqueeID(_ id: String) -> String { "string:" + id }
func mavisMarqueeID(_ id: Double) -> String { precondition(id.isFinite, "Marquee ids must be finite"); return "number:" + mavisString(id) }
struct MavisMarqueeItem: Identifiable, Equatable {
    let id: String
    let label: String
    var image: String?
}
/// Jolt owns the frame clock. Each completed linear segment schedules the next; pausing retains
/// its position and changing the geometry keeps the current normalized progress.
@MainActor private final class MavisMarqueeMotion: ObservableObject {
    let progress = try! JoltMotionValue(0)
    @Published var failed = false
    private var revision = 0
    private var duration: Double = 0
    private var running = false
    func configure(distance: Double, speed: Double, enabled: Bool, running: Bool) {
        revision += 1
        progress.cancel()
        self.running = running
        guard enabled && distance > 0 else { try! progress.set(0); duration = 0; return }
        duration = distance / speed * 1000
        segment(revision)
    }
    func resume(_ run: Bool) {
        running = run
        if run { progress.play() } else { progress.pause() }
    }
    func stop() { revision += 1; duration = 0; progress.cancel() }
    private func segment(_ token: Int) {
        guard token == revision && duration > 0 else { return }
        if progress.value >= 1 { try! progress.set(0) }
        let from = max(0, min(1, progress.value))
        // Very slow or very long marquees stay within Jolt's finite tween limits without
        // changing the requested speed, substituting a timer, or resetting between segments.
        let to = min(1, from + 60000 / duration)
        let started = ProcessInfo.processInfo.systemUptime
        try! progress.animate(to: to, transition: .tween(milliseconds: min(60000, (to-from)*duration), ease: .linear), completion: { [weak self] finished in
            guard finished, let self, token == self.revision else { return }
            guard ProcessInfo.processInfo.systemUptime - started >= 0.001 else { self.failed = true; return }
            self.segment(token)
        })
        if !running { progress.pause() }
    }
}
private struct MavisMarqueeViewport: Layout {
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let child = subviews.first?.sizeThatFits(.unspecified) ?? .zero
        return CGSize(width: proposal.width ?? child.width, height: child.height)
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        subviews.first?.place(at: bounds.origin, anchor: .topLeading, proposal: .unspecified)
    }
}
private struct MavisMarqueeOffset: ViewModifier {
    @ObservedObject var progress: JoltMotionValue
    let distance: Double
    let direction: String
    func body(content: Content) -> some View {
        content.offset(x: direction == "right" ? (progress.value-1)*distance : -progress.value*distance)
    }
}
struct MavisMarquee: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let items: [MavisMarqueeItem]
    var autoplay = false
    var paused = false
    var speed: Double = 35
    var itemWidth: Double = 180
    var gap: Double = 16
    var direction = "left"
    var playLabel = "Play motion"
    var pauseLabel = "Pause motion"
    var onUpdatePaused: (Bool) -> Void = { _ in }
    @State private var requested = false
    @State private var hovered = false
    @State private var width: Double = 0
    @StateObject private var motion = MavisMarqueeMotion()
    @StateObject private var viewport = try! JoltViewportEntry(threshold: 0, once: false)
    @Environment(\\.accessibilityReduceMotion) private var reduced
    @Environment(\\.mavisReduceMotion) private var asked
    private var moving: Bool { requested && !reduced && !asked && !motion.failed && !items.isEmpty }
    private var distance: Double { Double(items.count) * (itemWidth + gap) }
    private func running(_ available: Bool) -> Bool { moving && !paused && !hovered && available && viewport.visible }
    private func update(_ available: Bool) { motion.configure(distance: distance, speed: speed, enabled: moving, running: running(available)) }
    private func card(_ item: MavisMarqueeItem) -> some View {
        MavisCard(paddingX: ${metric('space.md')}, paddingY: ${metric('space.md')}) {
            MavisColumn(spacing: ${metric('space.sm')}) {
                if let image = item.image, !image.isEmpty {
                    MavisImage(src: image, alt: "", aspectRatio: nil, fit: .contain).frame(height: 64)
                }
                Text(verbatim: item.label).font(${font('heading')}).foregroundStyle(MavisTokens.text)
            }
        }.frame(width: itemWidth).mavisItem(shrink: 0, width: .points(itemWidth))
    }
    @ViewBuilder private var track: some View {
        if moving {
            MavisMarqueeViewport {
                HStack(spacing: gap) {
                    ForEach(0..<max(2, Int(ceil(width / max(1,distance))) + 1), id: \\.self) { copy in
                        ForEach(items) { item in card(item).accessibilityHidden(copy > 0) }
                    }
                }.modifier(MavisMarqueeOffset(progress: motion.progress, distance: distance, direction: direction))
            }.clipped()
        } else {
            MavisRow(spacing: gap, wrap: true) { ForEach(items) { item in card(item) } }
        }
    }
    var body: some View {
        let _ = precondition(speed.isFinite && speed > 0 && speed <= 500 && itemWidth.isFinite && itemWidth >= 80 && gap.isFinite && gap >= 0 && ["left","right"].contains(direction), "Invalid MMarquee motion options")
        let _ = precondition(Set(items.map(\\.id)).count == items.count && items.allSatisfy { !$0.id.isEmpty && !$0.label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }, "Marquee items need unique ids and nonempty labels")
        MavisMotionReader { available in
            MavisColumn(spacing: ${metric('space.sm')}) {
                MavisRow(spacing: ${metric('space.sm')}, justify: .between, wrap: true) {
                    Text(verbatim: label).font(${font('heading')}).foregroundStyle(MavisTokens.text)
                    Button(requested && !paused ? pauseLabel : playLabel) {
                        let next = !requested || paused
                        motion.failed = false
                        requested = next
                        onUpdatePaused(!next)
                    }.buttonStyle(MavisButtonStyle(variant: .ghost, size: .sm))
                        .disabled(reduced || asked || items.isEmpty)
                }
                track
                    .background(GeometryReader { proxy in Color.clear.onAppear { width = proxy.size.width }.onChange(of: proxy.size.width) { _, next in width = next } })
                    .joltViewportEnter(viewport, from: .identity, to: .identity)
                    .onHover { hovered = $0 }
            }
            .onAppear { requested = autoplay; update(available) }
            .onChange(of: autoplay) { _, next in motion.failed = false; requested = next }
            .onChange(of: [distance, speed, width, moving ? 1 : 0, direction == "left" ? 0 : 1]) { _, _ in update(available) }
            .onChange(of: running(available)) { _, run in motion.resume(run) }
            .onDisappear { motion.stop() }
        }
    }
}`,
}
