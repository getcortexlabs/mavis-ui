import AppKit

extension __FIXTURE__ {
    @MainActor final class NativeMotionAnchorProbe: MotionAnchorProbe {
        private func turn() async {
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { continuation.resume() }
            }
        }
        private func check(_ condition: Bool, _ message: String) throws {
            if !condition {
                print("Motion anchor probe: \(message)")
                throw MavisFailure(message: message)
            }
        }
        func run() async throws -> String {
            let surface = MavisMotionSurface()
            let content = NSView(frame: NSRect(x: 0, y: 0, width: 100, height: 100))
            let window = NSWindow(contentRect: content.frame, styleMask: [.borderless], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false
            window.contentView = content
            defer { surface.dispose(); window.close() }
            var setups = 0
            var cleanups = 0
            let stop = surface.onAvailable { () -> (() -> Void) in
                setups += 1
                return { cleanups += 1 }
            }
            defer { stop() }
            let retired = MavisMotionSurfaceAnchor.Anchor(surface)
            content.addSubview(retired)
            await turn()
            try check(surface.presentationView === retired && setups == 1, "Initial attachment failed")

            // Precisely the representable replacement order: refresh queues a publication,
            // dismantle retires it while it still belongs to the window, then the new anchor
            // appears. The old queued work must not seize ownership before the new work runs.
            retired.refresh(surface)
            MavisMotionSurfaceAnchor.dismantleNSView(retired, coordinator: ())
            try check(retired.window != nil && !surface.available && cleanups == 1, "Dismantle did not release ownership")
            let current = MavisMotionSurfaceAnchor.Anchor(surface)
            content.addSubview(current)
            await turn()
            try check(surface.presentationView === current && setups == 2 && cleanups == 1, "Queued retired view stole the replacement")
            retired.refresh(surface)
            retired.removeFromSuperview()
            await turn()
            try check(surface.presentationView === current && setups == 2 && cleanups == 1, "Retired refresh or removal detached the new owner")

            current.refresh(surface)
            current.removeFromSuperview()
            try check(!surface.available && cleanups == 2, "Leaving a window must release synchronously")
            await turn()
            try check(!surface.available && setups == 2, "Queued publication rebound a removed view")
            content.addSubview(current)
            await turn()
            try check(surface.presentationView === current && setups == 3, "A non-retired view could not reattach")
            MavisMotionSurfaceAnchor.dismantleNSView(current, coordinator: ())
            await turn()
            try check(!surface.available && cleanups == 3, "Final cleanup was missing or duplicated")
            return "Motion attachment checks passed"
        }
    }
    @MainActor static func services() -> MavisServices {
        MavisServices(motionAnchorProbe: NativeMotionAnchorProbe())
    }
}
