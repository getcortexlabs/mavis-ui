// Whether motion can run where a view is, for the components whose motion Jolt runs on its
// clock: JoltMotionValue, JoltDragModel and what follows them.

/** Swift helpers several components call; written once, before the first component using them. */
export const motionRuntime = {
  swiftRuntime: () => `private struct MavisReduceMotionKey: EnvironmentKey {
    static let defaultValue = false
}

extension EnvironmentValues {
    /// Reduced motion the app asked for, beside the system's setting. Jolt keeps its own copy to
    /// itself, so Mavis carries one for its views.
    var mavisReduceMotion: Bool {
        get { self[MavisReduceMotionKey.self] }
        set { self[MavisReduceMotionKey.self] = newValue }
    }
}

extension View {
    /// Asks Mavis and Jolt for reduced motion in this subtree. The system's setting always applies.
    func mavisReduceMotion(_ enabled: Bool) -> some View {
        environment(\\.mavisReduceMotion, enabled).joltReduceMotion(enabled)
    }
}

/// Hands its content whether motion can run here: nobody asked for less of it, and the window is
/// on screen. Jolt's clock keeps no time for a window that is not, so a value animated there
/// would never arrive: a view sets it at once instead.
struct MavisMotionReader<Content: View>: View {
    @ViewBuilder var content: (Bool) -> Content
    @Environment(\\.accessibilityReduceMotion) private var reduced
    @Environment(\\.mavisReduceMotion) private var asked
    @State private var shown = false

    var body: some View {
        content(shown && !reduced && !asked)
            .background(MavisWindowProbe { shown = $0 })
    }
}

private struct MavisWindowProbe: NSViewRepresentable {
    let report: @MainActor (Bool) -> Void

    func makeNSView(context: Context) -> Probe {
        let view = Probe()
        view.report = report
        return view
    }

    func updateNSView(_ view: Probe, context: Context) { view.report = report }

    static func dismantleNSView(_ view: Probe, coordinator: ()) { view.observe(nil) }

    @MainActor final class Probe: NSView {
        var report: (@MainActor (Bool) -> Void)?
        private var token: NSObjectProtocol?
        private var last: Bool?

        override func hitTest(_ point: NSPoint) -> NSView? { nil }

        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
            observe(window)
            publish()
        }

        func observe(_ next: NSWindow?) {
            if let token { NotificationCenter.default.removeObserver(token) }
            token = next.map { window in
                NotificationCenter.default.addObserver(forName: NSWindow.didChangeOcclusionStateNotification, object: window, queue: .main) { [weak self] _ in
                    MainActor.assumeIsolated { self?.publish() }
                }
            }
        }

        private func publish() {
            let shown = window.map { $0.isVisible && $0.occlusionState.contains(.visible) } ?? false
            guard shown != last else { return }
            last = shown
            // Outside the view update that moved the view.
            DispatchQueue.main.async { [weak self] in self?.report?(shown) }
        }
    }
}`,
}
