// What the scrolling components share on the Mac: Jolt's scroll position, and a way to send a
// scroll view to an offset, which SwiftUI on macOS 14 only does to views.
export const scrollRuntime = {
  swiftRuntime:
    () => `/// The scroll position Jolt reads from the scroll view under a JoltScrollView.
@MainActor func mavisScrollProgress() -> JoltScrollProgress { try! JoltScrollProgress() }

/// A height nothing is drawn in.
struct MavisGap: View {
    let height: Double
    var body: some View {
        Rectangle().fill(.clear).frame(height: Swift.max(0, height)).accessibilityHidden(true)
    }
}

/// Where a scroll view is sent: an offset from the top, once for each serial.
struct MavisScrollMove: Equatable {
    var y: Double = 0
    var serial = 0
    var animated = false
}

/// Sends the scroll view around it to an offset. It waits for the content to be tall enough.
struct MavisScroller: NSViewRepresentable {
    let move: MavisScrollMove

    func makeNSView(context: Context) -> Mover { Mover() }
    func updateNSView(_ view: Mover, context: Context) { view.take(move) }
    static func dismantleNSView(_ view: Mover, coordinator: ()) { view.forget() }

    final class Mover: NSView {
        private var done = 0
        private var pending: MavisScrollMove?
        private var observed: NSObjectProtocol?

        override func hitTest(_ point: NSPoint) -> NSView? { nil }
        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
            apply()
        }
        override func layout() {
            super.layout()
            apply()
        }

        func take(_ move: MavisScrollMove) {
            if move.serial != done {
                done = move.serial
                pending = move
            }
            apply()
        }

        func forget() {
            pending = nil
            if let observed { NotificationCenter.default.removeObserver(observed) }
            observed = nil
        }

        private func apply() {
            guard let move = pending, window != nil, let scroll = enclosingScrollView, let document = scroll.documentView else { return }
            let clip = scroll.contentView
            let extent = Swift.max(0, document.bounds.height - clip.bounds.height)
            guard move.y <= extent + 0.5 else {
                // The content is still growing: try again when its frame changes.
                if observed == nil {
                    document.postsFrameChangedNotifications = true
                    observed = NotificationCenter.default.addObserver(forName: NSView.frameDidChangeNotification, object: document, queue: .main) { [weak self] _ in
                        self?.apply()
                    }
                }
                return
            }
            forget()
            let y = document.isFlipped ? move.y : extent - move.y
            let origin = NSPoint(x: clip.bounds.minX, y: document.bounds.minY + Swift.min(y, extent))
            if move.animated {
                NSAnimationContext.runAnimationGroup { context in
                    context.duration = 0.25
                    context.allowsImplicitAnimation = true
                    clip.animator().setBoundsOrigin(origin)
                    scroll.reflectScrolledClipView(clip)
                }
            } else {
                clip.scroll(to: origin)
                scroll.reflectScrolledClipView(clip)
            }
        }
    }
}`,
}
