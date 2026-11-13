import { MColumn } from './stack.mjs'
import { motionRuntime } from './motion.mjs'

// MReveal is a real column with its own layout props. The legacy Show animate syntax keeps
// its existing behavior; authored MReveal no longer borrows spacing from its parent.
export const MReveal = {
  ...MColumn,
  props: { ...MColumn.props, show: 'boolean' },
  types: undefined,
  declaration: 'declare function MReveal(props: MavisStack & { show?: boolean }): JSX.Element',
  uses: [...(MColumn.uses ?? []), motionRuntime],
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const { show, ...props } = node.props
    return `${pad}MavisReveal(show: ${show ? emit.value(show) : 'false'}) {\n${MColumn.swift({ ...node, props }, { ...context, indent: indent + 4 })}\n${pad}}`
  },
  swiftRuntime: ({
    theme,
    scoped,
  }) => `@MainActor private final class MavisRevealModel: ObservableObject {
    @Published var present: Bool
    @Published var settled = true
    let progress: JoltMotionValue
    private var revision = 0
    init(_ show: Bool) {
        present = show
        progress = try! JoltMotionValue(show ? 1 : 0)
    }
    func update(_ show: Bool, moving: Bool, transition: JoltTransition? = nil) {
        revision += 1
        let token = revision
        if show { present = true }
        if !moving {
            try? progress.set(show ? 1 : 0)
            present = show
            settled = true
            return
        }
        settled = false
        let duration: Double = show ? ${theme.motion.enterDuration} : ${theme.motion.exitDuration}
        let transition = transition ?? (try! .tween(milliseconds: duration, ease: .${theme.motion.ease}))
        try? progress.animate(to: show ? 1 : 0, transition: transition) { [weak self] finished in
            guard let self, finished, self.revision == token else { return }
            self.present = show
            self.settled = true
        }
    }
}

private struct MavisRevealHeight: Layout {
    var progress: Double
    var expanded: Bool
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        guard let child = subviews.first else { return .zero }
        let size = child.sizeThatFits(ProposedViewSize(width: proposal.width, height: nil))
        return CGSize(width: size.width, height: expanded ? size.height : size.height * min(1, max(0, progress)))
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        subviews.first?.place(at: bounds.origin, anchor: .topLeading, proposal: ProposedViewSize(width: bounds.width, height: nil))
    }
}

private struct MavisRevealContent<Content: View>: View {
    @ObservedObject var progress: JoltMotionValue
    var expanded: Bool
    @ViewBuilder var content: () -> Content
    var body: some View {
        MavisRevealHeight(progress: progress.value, expanded: expanded) { content() }
            .opacity(progress.value)
            .clipShape(MavisRevealClip(expanded: expanded))
    }
}
private struct MavisRevealClip: Shape {
    let expanded: Bool
    func path(in rect: CGRect) -> Path { Path(expanded ? rect.insetBy(dx: -1_000_000, dy: -1_000_000) : rect) }
}

struct MavisReveal<Content: View>: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let show: Bool
    @ViewBuilder let content: () -> Content
    @StateObject private var model: MavisRevealModel
    @State private var anchor = MavisRevealFocus()
    init(show: Bool, @ViewBuilder content: @escaping () -> Content) {
        self.show = show
        self.content = content
        _model = StateObject(wrappedValue: MavisRevealModel(show))
    }
    var body: some View {
        MavisMotionReader { moving in
            Group {
                if model.present {
                    MavisRevealContent(progress: model.progress, expanded: show && model.settled, content: content)
                        .allowsHitTesting(show)
                        .accessibilityHidden(!show)
                }
            }
            .background(MavisRevealFocusReader(anchor: anchor))
            .onChange(of: show) { _, next in
                if next { anchor.capture() } else { anchor.restore() }
                model.update(next, moving: moving${scoped ? ', transition: mavisTheme.palette.metrics.motion.tween(next)' : ''})
            }
            .onChange(of: moving) { _, next in if !next { model.update(show, moving: false) } }
        }
        .layoutValue(key: MavisAbsentKey.self, value: !model.present)
    }
}

@MainActor private final class MavisRevealFocus {
    weak var view: NSView?
    weak var trigger: NSResponder?
    private func contains(_ responder: NSResponder?) -> Bool {
        guard let view, let candidate = responder as? NSView, candidate.window === view.window else { return false }
        let center = CGPoint(x: candidate.bounds.midX, y: candidate.bounds.midY)
        return view.bounds.contains(view.convert(center, from: candidate))
    }
    func capture() {
        if let responder = view?.window?.firstResponder, !contains(responder) { trigger = responder }
    }
    func restore() {
        guard let window = view?.window, contains(window.firstResponder), let trigger else { return }
        if let target = trigger as? NSView, target.window !== window { return }
        window.makeFirstResponder(trigger)
    }
}
private struct MavisRevealFocusReader: NSViewRepresentable {
    let anchor: MavisRevealFocus
    func makeNSView(context: Context) -> NSView { let view = Probe(); anchor.view = view; return view }
    func updateNSView(_ view: NSView, context: Context) { anchor.view = view }
    private class Probe: NSView { override func hitTest(_ point: NSPoint) -> NSView? { nil } }
}`,
  vue: { ...MColumn.vue, runtime: undefined },
}
