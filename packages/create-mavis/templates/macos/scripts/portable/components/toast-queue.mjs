// Same ownership and queue policy as core/toast.ts; presentation owns entry/exit timing.
export function toastQueueSwift(theme, { scoped = false } = {}) {
  return `@MainActor final class MavisToastQueue: ObservableObject {
    @Published private(set) var message: MavisToastMessage?
    @Published private(set) var visible = false
    @Published private(set) var owner: UUID?
    @Published private(set) var requested = false
    private var items: [MavisToastMessage] = []
    private static var nextID: Double = 0
    private let persistent: Bool
    private var active = false
    private var accepting = true
    private var disposed = false
    private var presenting = false
    private var entered = false
    private var closing = false
    private var stage = 0
    private var remaining = 0.0
    private var started = Date()
    private var timer: _Concurrency.Task<Void, Never>?
    private var pauses: Set<String> = []
    private var enter: Double = ${theme.motion.enterDuration}
    private var leave: Double = ${theme.motion.exitDuration + 40}

${
  scoped
    ? `    func configure(_ motion: MavisMotionMetrics) {
        enter = motion.enterDuration
        leave = motion.exitDuration + 40
    }
`
    : ''
}
    init(persistent: Bool = false) { self.persistent = persistent }
    func request() {
        guard !requested && !disposed else { return }
        // Attachment updates run during a SwiftUI transaction; publish the request after it.
        _Concurrency.Task { @MainActor [weak self] in
            guard let self, !self.disposed, !self.requested else { return }
            self.requested = true
        }
    }
    func owns(_ host: UUID) -> Bool { !disposed && owner == host }

    @discardableResult func show(message: String, title: String? = nil, tone: String? = nil, duration: Double? = nil) -> Double? {
        let time = duration ?? 5000
        guard !mavisTrim(message).isEmpty, title == nil || !mavisTrim(title!).isEmpty,
              tone == nil || MavisToastTone(rawValue: tone!) != nil,
              time.isFinite, time >= 0, time <= 2147483647 else { return nil }
        Self.nextID += 1
        guard accepting && !disposed else { return nil }
        let item = MavisToastMessage(id: Self.nextID, title: title, message: message, tone: MavisToastTone(tone), duration: time)
        items.append(item)
        if items.count == 1 { advance() }
        return item.id
    }

    func dismiss(_ id: Double? = nil) {
        guard let id = id ?? items.first?.id, let index = items.firstIndex(where: { $0.id == id }) else { return }
        if index > 0 { items.remove(at: index); return }
        guard !closing else { return }
        stop()
        if !presenting || !active {
            items.removeFirst()
            advance()
        } else {
            closing = true
            publish()
            guard let host = owner else { return }
            after(leave) { queue in queue.left(id, host: host) }
        }
    }

    func clear() {
        if items.count > 1 { items.removeSubrange(1...) }
        dismiss()
    }

    func activate(_ host: UUID) {
        guard !disposed, owner != host else { return }
        if let before = owner { deactivate(before) }
        owner = host
        active = true
        accepting = true
        publish()
        present()
    }

    func deactivate(_ host: UUID) {
        guard owner == host else { return }
        stop()
        stage += 1
        active = false
        pauses.removeAll()
        if persistent && !disposed {
            if closing { items.removeFirst(); remaining = items.first?.duration ?? 0 }
            presenting = false; entered = false; closing = false
            publish()
        } else {
            accepting = false
            items.removeAll()
            advance()
        }
        owner = nil
    }

    func dispose() {
        guard !disposed else { return }
        disposed = true
        if let host = owner { deactivate(host) }
        else { accepting = false; items.removeAll(); advance() }
    }

    func pause(_ reason: String, _ paused: Bool, host: UUID) {
        guard owns(host) else { return }
        if paused { pauses.insert(reason); stop() }
        else { pauses.remove(reason); run() }
    }

    private func publish() {
        message = items.first; visible = active && !closing && message != nil
    }
    private func present() {
        guard let host = owner, let item = items.first, active, !closing else { return }
        presenting = true
        after(enter) { queue in
            guard queue.owns(host), queue.items.first?.id == item.id, !queue.closing else { return }
            queue.entered = true
            queue.run()
        }
    }
    private func advance() {
        stop()
        stage += 1
        presenting = false; entered = false; closing = false
        remaining = items.first?.duration ?? 0
        publish()
        present()
    }
    private func left(_ id: Double, host: UUID) {
        guard owns(host), items.first?.id == id, closing else { return }
        items.removeFirst()
        advance()
    }
    private func after(_ milliseconds: Double, _ then: @escaping @MainActor (MavisToastQueue) -> Void) {
        stage += 1
        let stage = stage
        _Concurrency.Task { [weak self] in
            try? await _Concurrency.Task.sleep(nanoseconds: UInt64(milliseconds * 1_000_000))
            guard let self, self.stage == stage else { return }
            then(self)
        }
    }
    private func run() {
        guard let item = message, item.duration > 0, active, entered, !closing, pauses.isEmpty, timer == nil else { return }
        started = Date()
        timer = _Concurrency.Task { [weak self] in
            guard let wait = self?.remaining else { return }
            try? await _Concurrency.Task.sleep(nanoseconds: UInt64(Swift.max(0, wait) * 1_000_000))
            guard let self, !_Concurrency.Task.isCancelled else { return }
            self.timer = nil
            if self.message?.id == item.id { self.dismiss(item.id) }
        }
    }
    private func stop() {
        guard let timer else { return }
        timer.cancel()
        self.timer = nil
        remaining = Swift.max(0, remaining - Date().timeIntervalSince(started) * 1000)
    }
}

/// One plugin-equivalent queue per entry identity. Never a process/SSR singleton.
@MainActor final class MavisApplicationToast: ObservableObject {
    let queue = MavisToastQueue(persistent: true)
    deinit {
        let queue = queue
        _Concurrency.Task { @MainActor in queue.dispose() }
    }
}
private struct MavisApplicationToastKey: EnvironmentKey {
    static let defaultValue: MavisApplicationToast? = nil
}
extension EnvironmentValues {
    var mavisApplicationToast: MavisApplicationToast? {
        get { self[MavisApplicationToastKey.self] }
        set { self[MavisApplicationToastKey.self] = newValue }
    }
}
private struct MavisAppToastScope: ViewModifier {
    @StateObject private var application = MavisApplicationToast()
    func body(content: Content) -> some View {
        content.environment(\\.mavisApplicationToast, application)
    }
}
private struct MavisRequestedToastHost: ViewModifier {
    @ObservedObject var queue: MavisToastQueue
    func body(content: Content) -> some View {
        content.mavisToast(queue, enabled: queue.requested)
    }
}
struct MavisAppToastScreenHost: ViewModifier {
    @Environment(\\.mavisApplicationToast) private var application
    func body(content: Content) -> some View {
        if let application { content.modifier(MavisRequestedToastHost(queue: application.queue)) }
        else { content }
    }
}
extension View {
    func mavisAppToastScope() -> some View { modifier(MavisAppToastScope()) }
}`
}
