// AppKit input only. Jolt controllers retain ownership of progress, bounds and settling.
export const trackpadPolicy = `func mavisTrackpadPage(_ distance: Double, index: Int, count: Int, loop: Bool = false, rtl: Bool = false) -> Int? {
    guard distance.isFinite, abs(distance) >= 40, count > 1, (0..<count).contains(index) else { return nil }
    let direction = (distance < 0 ? 1 : -1) * (rtl ? -1 : 1)
    let next = loop ? (index + direction + count) % count : min(count - 1, max(0, index + direction))
    return next == index ? nil : next
}
enum MavisTrackpadPhase: Equatable { case began, changed, ended, cancelled }
struct MavisTrackpadSample {
    var consumed = false
    var changed = false
    var finished = false
    var cancelled = false
    var translation = CGSize.zero
}
struct MavisTrackpadPolicy {
    private var horizontal: Bool? = nil
    private var total = CGSize.zero
    private var suppressMomentum = false
    var active: Bool { horizontal == true }
    var settlingMomentum: Bool { suppressMomentum }
    mutating func cancel() -> MavisTrackpadSample {
        let result = MavisTrackpadSample(consumed: active, finished: active, cancelled: true, translation: total)
        horizontal = nil; total = .zero; suppressMomentum = false
        return result
    }
    mutating func update(x: Double, y: Double, phase: MavisTrackpadPhase, precise: Bool = true, momentum: Bool = false, vertical: Bool = false) -> MavisTrackpadSample {
        guard precise, x.isFinite, y.isFinite else { return cancel() }
        if momentum {
            let consume = suppressMomentum
            if phase == .ended || phase == .cancelled { suppressMomentum = false }
            return MavisTrackpadSample(consumed: consume)
        }
        if phase == .began { _ = cancel() }
        if phase == .cancelled { return cancel() }
        total.width += x; total.height += y
        if horizontal == nil, max(abs(total.width), abs(total.height)) >= 4 {
            // A vertical sequence remains owned by the surrounding scroll view until it ends.
            horizontal = vertical || abs(total.width) > abs(total.height) * 1.25
        }
        let claimed = active
        let result = MavisTrackpadSample(consumed: claimed, changed: claimed && (phase != .ended || x != 0 || y != 0),
            finished: claimed && phase == .ended, translation: total)
        if phase == .ended {
            suppressMomentum = claimed
            horizontal = nil; total = .zero
        }
        return result
    }
}`

export const trackpadRuntime = {
  swiftRuntime: () => `${trackpadPolicy}

/// A local scroll-wheel adapter scoped to one clipped view. It never captures ordinary mouse
/// wheels, a vertical sequence, another window, or a gesture that starts outside its bounds.
/// No timer/animation is installed here: the component forwards input to its Jolt controller.
private struct MavisTrackpadInput: NSViewRepresentable {
    var enabled: Bool
    var vertical: Bool
    var identity: String
    let change: (CGSize) -> Void
    let end: (Bool) -> Void
    func makeNSView(context: Context) -> Anchor { Anchor(frame: .zero) }
    func updateNSView(_ view: Anchor, context: Context) { view.configure(self) }
    static func dismantleNSView(_ view: Anchor, coordinator: ()) { view.detach() }
    @MainActor final class Anchor: NSView {
        private var input: MavisTrackpadInput?
        private var policy = MavisTrackpadPolicy()
        private var monitor: Any?
        private var sequenceStartedHere = false
        private var cancellationPending = false
        override func hitTest(_ point: NSPoint) -> NSView? { nil }
        func configure(_ next: MavisTrackpadInput) {
            let changed = input != nil && input?.identity != next.identity
            input = next
            // A page change caused by our own end must not leak its momentum to the parent.
            if !next.enabled || changed && !policy.settlingMomentum {
                sequenceStartedHere = false
                let sample = policy.cancel()
                // Do not publish view state from updateNSView. This is cancellation delivery,
                // not a playback clock; the Jolt owner settles on the following main turn.
                if sample.finished {
                    cancellationPending = true
                    DispatchQueue.main.async { [weak self] in self?.flushCancellation() }
                }
            }
            attach()
        }
        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
            if window == nil { detach() } else { attach() }
        }
        private func attach() {
            guard monitor == nil, window != nil else { return }
            monitor = NSEvent.addLocalMonitorForEvents(matching: .scrollWheel) { [weak self] event in
                MainActor.assumeIsolated {
                    guard let self else { return event }
                    return self.receive(event)
                }
            }
        }
        private func flushCancellation() {
            guard cancellationPending else { return }
            cancellationPending = false
            input?.end(true)
        }
        private func cancel() {
            flushCancellation()
            sequenceStartedHere = false
            let cancelled = policy.cancel()
            if cancelled.finished { input?.end(true) }
        }
        func detach() {
            cancel()
            if let monitor { NSEvent.removeMonitor(monitor) }
            monitor = nil
        }
        private func receive(_ event: NSEvent) -> NSEvent? {
            // End an invalidated owner before another gesture can begin.
            flushCancellation()
            guard let input, input.enabled, let window, event.window === window,
                  !isHiddenOrHasHiddenAncestor,
                  visibleRect.contains(convert(event.locationInWindow, from: nil)) else {
                cancel(); return event
            }
            // Phase-less mouse-wheel events are not a two-finger gesture. Natural-scrolling
            // preference is already reflected in AppKit deltas; do not invert it again.
            guard event.hasPreciseScrollingDeltas, !event.phase.isEmpty || !event.momentumPhase.isEmpty else { cancel(); return event }
            let native = event.momentumPhase.isEmpty ? event.phase : event.momentumPhase
            let phase: MavisTrackpadPhase = native.contains(.cancelled) ? .cancelled
                : native.contains(.ended) ? .ended : native.contains(.began) || native.contains(.mayBegin) ? .began : .changed
            if event.momentumPhase.isEmpty && phase == .began {
                if policy.active { input.end(true) }
                sequenceStartedHere = true
            }
            guard sequenceStartedHere else { return event }
            let sample = policy.update(x: Double(event.scrollingDeltaX), y: Double(event.scrollingDeltaY), phase: phase,
                momentum: !event.momentumPhase.isEmpty, vertical: input.vertical)
            if sample.changed { input.change(sample.translation) }
            if sample.finished { input.end(sample.cancelled) }
            if phase == .cancelled || phase == .ended && (!sample.consumed || !event.momentumPhase.isEmpty) {
                sequenceStartedHere = false
            }
            return sample.consumed ? nil : event
        }
    }
}
extension View {
    func mavisTrackpad(enabled: Bool = true, vertical: Bool = false, identity: String = "",
                      change: @escaping (CGSize) -> Void, end: @escaping (Bool) -> Void) -> some View {
        background(MavisTrackpadInput(enabled: enabled, vertical: vertical, identity: identity, change: change, end: end))
    }
}`,
}
