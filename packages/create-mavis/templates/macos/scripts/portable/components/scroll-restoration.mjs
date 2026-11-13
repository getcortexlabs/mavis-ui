// Native scroll restoration belongs to a visit in a window's history. It neither changes the
// shared MScreen API nor animates a restore; layout may have changed since the visit was saved.
export const scrollRestorationRuntime = {
  swiftRuntime: () => `struct MavisScrollRestoration {
    let id: String
    let active: Bool
    let read: () -> Double
    let write: (Double) -> Void
}

private struct MavisScrollRestorationKey: EnvironmentKey {
    static let defaultValue: MavisScrollRestoration? = nil
}

extension EnvironmentValues {
    var mavisScrollRestoration: MavisScrollRestoration? {
        get { self[MavisScrollRestorationKey.self] }
        set { self[MavisScrollRestorationKey.self] = newValue }
    }
}

/// A marker inside MScreen's own scroll content. No route context means no persistence.
struct MavisScrollRestorer: NSViewRepresentable {
    let restoration: MavisScrollRestoration?

    func makeNSView(context: Context) -> Observer { Observer() }
    func updateNSView(_ view: Observer, context: Context) { view.take(restoration) }
    static func dismantleNSView(_ view: Observer, coordinator: ()) { view.forget() }

    final class Observer: NSView {
        private var restoration: MavisScrollRestoration?
        private weak var scroll: NSScrollView?
        private var notifications: [NSObjectProtocol] = []
        private var pending = false
        private var queued: DispatchWorkItem?
        private var applying = false

        override func hitTest(_ point: NSPoint) -> NSView? { nil }
        override func viewDidMoveToSuperview() { super.viewDidMoveToSuperview(); connect() }
        override func viewDidMoveToWindow() { super.viewDidMoveToWindow(); connect() }
        override func layout() { super.layout(); connect() }

        func take(_ next: MavisScrollRestoration?) {
            let entering = next?.active == true && (next?.id != restoration?.id || restoration?.active != true)
            restoration = next
            if entering { pending = true }
            if next?.active != true {
                queued?.cancel()
                queued = nil
                disconnect()
                return
            }
            connect()
        }

        private func connect() {
            guard restoration?.active == true else { return }
            if let found = enclosingScrollView, found !== scroll {
                disconnect()
                scroll = found
                pending = true
                let clip = found.contentView
                clip.postsBoundsChangedNotifications = true
                notifications.append(NotificationCenter.default.addObserver(forName: NSView.boundsDidChangeNotification, object: clip, queue: .main) { [weak self] _ in self?.changed() })
                if let document = found.documentView {
                    document.postsFrameChangedNotifications = true
                    notifications.append(NotificationCenter.default.addObserver(forName: NSView.frameDidChangeNotification, object: document, queue: .main) { [weak self] _ in self?.schedule() })
                }
            }
            schedule()
        }

        private func schedule() {
            guard pending, queued == nil, restoration?.active == true else { return }
            let work = DispatchWorkItem { [weak self] in
                guard let self else { return }
                self.queued = nil
                self.restore()
            }
            queued = work
            // Read the settled document/viewport geometry after the current SwiftUI update.
            DispatchQueue.main.async(execute: work)
        }

        private func restore() {
            guard pending, let restoration, restoration.active,
                  let scroll, let document = scroll.documentView else { return }
            scroll.layoutSubtreeIfNeeded()
            let clip = scroll.contentView
            guard clip.bounds.height > 0, document.bounds.height > 0 else { return }
            let extent = Swift.max(0, document.bounds.height - clip.bounds.height)
            let requested = restoration.read()
            let offset = Swift.min(Swift.max(0, requested.isFinite ? requested : 0), extent)
            let y = document.bounds.minY + (document.isFlipped ? offset : extent - offset)
            applying = true
            pending = false
            clip.scroll(to: NSPoint(x: clip.bounds.minX, y: y))
            scroll.reflectScrolledClipView(clip)
            applying = false
            restoration.write(offset)
        }

        private func changed() {
            guard !applying, !pending, let restoration, restoration.active,
                  let scroll, let document = scroll.documentView else { return }
            let clip = scroll.contentView
            let extent = Swift.max(0, document.bounds.height - clip.bounds.height)
            let coordinate = clip.bounds.minY - document.bounds.minY
            let offset = document.isFlipped ? coordinate : extent - coordinate
            restoration.write(Swift.min(Swift.max(0, offset), extent))
        }

        private func disconnect() {
            for observed in notifications { NotificationCenter.default.removeObserver(observed) }
            notifications.removeAll()
            scroll = nil
        }

        func forget() {
            queued?.cancel()
            queued = nil
            pending = false
            restoration = nil
            disconnect()
        }
    }
}`,
}
