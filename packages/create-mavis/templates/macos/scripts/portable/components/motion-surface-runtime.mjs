// Runtime of the format-neutral motion surface. Jolt owns timing, sampled values, ownership
// and projection. Mavis owns presentation attachment and the shared playback vocabulary.
export const motionSurfaceRuntime = {
  swiftRuntime:
    () => `enum MavisMotionFailure: Error { case unavailable, invalidFrames, invalidOptions }
struct MavisMotionOptions {
    var type: String? = nil
    var duration: Double? = nil
    var bounce: Double? = nil
    var ease: String? = nil
    var delay: Double = 0
    func transition(_ channel: String) throws -> JoltTransition {
        guard delay.isFinite, delay >= 0, delay <= 60000 else { throw MavisMotionFailure.invalidOptions }
        // Match Jolt's shared resolveTransition: an explicit curve implies tween unless
        // bounce asks for a spring; opacity defaults to tween and transforms to spring.
        let resolved = type ?? (bounce != nil ? "spring" : duration != nil || ease != nil || channel == "opacity" ? "tween" : "spring")
        switch resolved {
        case "spring": return try .spring(milliseconds: duration ?? 400, bounce: bounce ?? 0.15)
        case "tween":
            let curve: JoltEase
            switch ease ?? "easeOut" { case "linear": curve = .linear; case "easeIn": curve = .easeIn; case "easeOut": curve = .easeOut; case "easeInOut": curve = .easeInOut; default: throw MavisMotionFailure.invalidOptions }
            return try .tween(milliseconds: duration ?? 300, ease: curve)
        default: throw MavisMotionFailure.invalidOptions
        }
    }
}

@MainActor final class MavisMotionPlayback: ObservableObject {
    private var timeline: JoltTimeline?
    private var result: Bool?
    private var waiting: [CheckedContinuation<Bool, Never>] = []
    private var release: (() -> Void)?
    private var owners: [MavisMotionPresentation] = []
    var paused: Bool { timeline?.paused ?? false }
    var duration: Double { timeline?.duration ?? 0 }
    var progress: Double {
        get { timeline?.progress ?? (result == true ? 1 : 0) }
        set { if let timeline { try? timeline.seek(to: newValue) } }
    }
    var finished: Bool {
        get async {
            if let result { return result }
            return await withCheckedContinuation { waiting.append($0) }
        }
    }
    init(completed: Bool? = nil) { result = completed }
    func start(_ tracks: [JoltTimelineTrack], owners: [MavisMotionPresentation], release: @escaping () -> Void) throws {
        self.release = release
        self.owners = owners
        let reduced = owners.contains { $0.reduced }
        let suspended = owners.contains { $0.suspended }
        let next = try JoltTimeline(tracks: tracks, reducedMotion: reduced, autoplay: false, completion: { [weak self] done in self?.finish(done) })
        timeline = next
        // Reduced motion settles immediately, even when the presentation is occluded.
        // Otherwise a hidden window correctly keeps the pending playback suspended.
        if suspended && !reduced { next.suspend() }
        next.play()
    }
    private func finish(_ completed: Bool) {
        guard result == nil else { return }
        result = completed
        owners.removeAll()
        let continuations = waiting; waiting.removeAll()
        let release = self.release; self.release = nil
        release?()
        for continuation in continuations { continuation.resume(returning: completed) }
    }
    func updateEnvironment() {
        if owners.contains(where: { $0.reduced }) { settle() }
        else if owners.contains(where: { $0.suspended }) { suspend() }
        else { unsuspend() }
    }
    func stop() { timeline?.cancel(); finish(false) }
    func pause() { timeline?.pause() }
    func resume() { timeline?.play() }
    func suspend() { timeline?.suspend() }
    func unsuspend() { timeline?.resume() }
    func settle() { try? timeline?.seek(to: 1); finish(true) }
    func dispose() { stop(); timeline?.dispose(); timeline = nil }
}

@MainActor class MavisMotionPresentation: ObservableObject {
    @Published private(set) var available = false
    private var playbacks: [UUID: MavisMotionPlayback] = [:]
    private var setups: [UUID: () -> (() -> Void)?] = [:]
    private var cleanups: [UUID: () -> Void] = [:]
    private var observers: [UUID: () -> Void] = [:]
    private weak var attachment: NSView?
    var presentationView: NSView? { attachment }
    private(set) var reduced = false
    private(set) var suspended = false
    private var disposed = false
    func attach(_ view: NSView) {
        guard !disposed else { return }
        precondition(attachment == nil || attachment === view, "One motion surface cannot bind to multiple views")
        attachment = view
        guard !available else { return }
        available = true
        for id in Array(setups.keys) { invokeSetup(id) }
        for observe in Array(observers.values) { observe() }
    }
    func detach(_ view: NSView) {
        guard attachment === view else { return }
        attachment = nil
        available = false
        clearSetups()
        let active = Array(playbacks.values)
        playbacks.removeAll()
        for playback in active { playback.dispose() }
        resetPresentation()
        for observe in Array(observers.values) { observe() }
    }
    func environment(reduced: Bool, visible: Bool) {
        self.reduced = reduced
        suspended = !visible
        for playback in Array(playbacks.values) {
            playback.updateEnvironment()
        }
    }
    private func clearSetups() {
        let pending = Array(cleanups.values); cleanups.removeAll()
        for cleanup in pending { cleanup() }
    }
    private func invokeSetup(_ id: UUID) {
        guard let setup = setups[id], available else { return }
        let before = Set(playbacks.keys)
        let cleanup = setup()
        let created = Set(playbacks.keys).subtracting(before)
        cleanups[id] = { [weak self] in
            cleanup?()
            guard let self else { return }
            for id in created { self.playbacks[id]?.stop() }
        }
    }
    private func register(_ setup: @escaping () -> (() -> Void)?) -> () -> Void {
        guard !disposed else { return {} }
        let id = UUID(); setups[id] = setup
        if available { invokeSetup(id) }
        return { [weak self] in
            guard let self else { return }
            self.setups.removeValue(forKey: id)
            self.cleanups.removeValue(forKey: id)?()
        }
    }
    @discardableResult func onAvailable(_ setup: @escaping () -> Void) -> () -> Void {
        register { setup(); return nil }
    }
    @discardableResult func onAvailable(_ setup: @escaping () -> (() -> Void)) -> () -> Void {
        register { setup() }
    }
    func observeAvailability(_ observer: @escaping () -> Void) -> () -> Void {
        let id = UUID(); observers[id] = observer
        return { [weak self] in self?.observers.removeValue(forKey: id) }
    }
    func refresh() throws { guard available else { throw MavisMotionFailure.unavailable } }
    @discardableResult func play(_ tracks: [JoltTimelineTrack], targets: [MavisMotionPresentation] = []) throws -> MavisMotionPlayback {
        var seen = Set<ObjectIdentifier>()
        let owners = ([self] + targets).filter { seen.insert(ObjectIdentifier($0)).inserted }
        guard owners.allSatisfy({ $0.available }) else { throw MavisMotionFailure.unavailable }
        let playback = MavisMotionPlayback(), id = UUID()
        for owner in owners { owner.playbacks[id] = playback }
        do { try playback.start(tracks, owners: owners, release: {
            for owner in owners { owner.playbacks.removeValue(forKey: id) }
        }) }
        catch { for owner in owners { owner.playbacks.removeValue(forKey: id) }; throw error }
        return playback
    }
    func resetPresentation() {}
    func disposeResources() {}
    func dispose() {
        guard !disposed else { return }
        disposed = true; available = false; attachment = nil
        setups.removeAll()
        clearSetups()
        let active = Array(playbacks.values); playbacks.removeAll()
        for playback in active { playback.dispose() }
        disposeResources()
        for observe in Array(observers.values) { observe() }
        observers.removeAll()
    }
}
@MainActor final class MavisMotionSurface: MavisMotionPresentation {
    let values: [JoltValueProperty: JoltMotionValue]
    private let ownsValues: Bool
    private var children: [UUID: MavisMotionSurface] = [:]
    override init() {
        ownsValues = true
        values = Dictionary(uniqueKeysWithValues: JoltValueProperty.allCases.map { property in
            (property, try! JoltMotionValue([.scale,.scaleX,.scaleY,.opacity].contains(property) ? 1 : 0))
        })
        super.init()
    }
    private init(sharing parent: MavisMotionSurface) {
        ownsValues = false
        values = parent.values
        super.init()
    }
    override func environment(reduced: Bool, visible: Bool) {
        super.environment(reduced: reduced, visible: visible)
        for child in Array(children.values) { child.environment(reduced: reduced, visible: visible) }
    }
    private func useOwner(_ setup: @escaping (MavisMotionSurface) -> (() -> Void)?) -> () -> Void {
        onAvailable { [weak self] () -> (() -> Void) in
            guard let self, let view = self.presentationView else { return {} }
            let child = MavisMotionSurface(sharing: self), id = UUID()
            self.children[id] = child
            child.environment(reduced: self.reduced, visible: !self.suspended)
            child.attach(view)
            let cleanup = setup(child)
            return {
                cleanup?()
                child.dispose()
                self.children.removeValue(forKey: id)
            }
        }
    }
    @discardableResult func use(_ setup: @escaping (MavisMotionSurface) -> Void) -> () -> Void {
        useOwner { setup($0); return nil }
    }
    @discardableResult func use(_ setup: @escaping (MavisMotionSurface) -> (() -> Void)) -> () -> Void {
        useOwner { setup($0) }
    }
    override func resetPresentation() {
        for (property, value) in values { try? value.set([.scale,.scaleX,.scaleY,.opacity].contains(property) ? 1 : 0) }
    }
    override func disposeResources() {
        let pending = Array(children.values); children.removeAll()
        for child in pending { child.dispose() }
        if ownsValues { for value in values.values { value.dispose() } }
    }
    @discardableResult func set(_ poses: [String: Double]) throws -> MavisMotionPlayback {
        guard available else { throw MavisMotionFailure.unavailable }
        let checked = try poses.map { name, value -> (JoltMotionValue, Double) in
            guard let property = JoltValueProperty(rawValue: name), let target = values[property], value.isFinite else { throw MavisMotionFailure.invalidFrames }
            return (target, value)
        }
        for (target, value) in checked { try target.set(value) }
        return MavisMotionPlayback(completed: true)
    }
    func tracks(_ frames: [String: [Double?]], options: MavisMotionOptions, at: Double = 0) throws -> [JoltTimelineTrack] {
        guard available else { throw MavisMotionFailure.unavailable }
        return try frames.map { name, frames in
            guard let property = JoltValueProperty(rawValue: name), let target = values[property], (1...2).contains(frames.count), let last = frames.last!, last.isFinite, frames.dropLast().allSatisfy({ $0 == nil || $0!.isFinite }) else { throw MavisMotionFailure.invalidFrames }
            let transition = try options.transition(name)
            return JoltTimelineTrack(target, to: last, from: frames.count == 2 ? frames[0] : nil, at: at + options.delay, transition: transition)
        }
    }
    @discardableResult func animate(_ frames: [String: [Double?]], options: MavisMotionOptions = .init()) throws -> MavisMotionPlayback {
        let tracks = try tracks(frames, options: options)
        return try play(tracks)
    }
}

@MainActor private final class MavisMotionAvailability {
    private let sources: [MavisMotionPresentation]
    private let setup: () -> (() -> Void)?
    private var cleanup: (() -> Void)?
    private var subscriptions: [() -> Void] = []
    private var active = false
    private var stopped = false
    init(_ sources: [MavisMotionPresentation], setup: @escaping () -> (() -> Void)?) {
        var seen = Set<ObjectIdentifier>()
        self.sources = sources.filter { seen.insert(ObjectIdentifier($0)).inserted }
        self.setup = setup
    }
    func start() {
        for source in sources {
            subscriptions.append(source.onAvailable { () -> (() -> Void) in
                self.update()
                return { self.clear() }
            })
        }
        update()
    }
    private func update() {
        guard !stopped, !active, !sources.isEmpty, sources.allSatisfy({ $0.available }) else { return }
        active = true; cleanup = setup()
    }
    private func clear() {
        active = false
        let previous = cleanup; cleanup = nil
        previous?()
    }
    func stop() {
        guard !stopped else { return }; stopped = true
        let pending = subscriptions; subscriptions.removeAll()
        for stop in pending { stop() }
        clear()
    }
}
@MainActor @discardableResult func mavisWhenMotionAvailable(_ sources: [MavisMotionPresentation], _ setup: @escaping () -> Void) -> () -> Void {
    let group = MavisMotionAvailability(sources) { setup(); return nil }
    group.start(); return { group.stop() }
}
@MainActor @discardableResult func mavisWhenMotionAvailable(_ sources: [MavisMotionPresentation], _ setup: @escaping () -> (() -> Void)) -> () -> Void {
    let group = MavisMotionAvailability(sources) { setup() }
    group.start(); return { group.stop() }
}
private struct MavisMotionSurfaceBinding: ViewModifier {
    @ObservedObject var surface: MavisMotionSurface
    @Environment(\\.accessibilityReduceMotion) private var reduced
    @Environment(\\.mavisReduceMotion) private var asked
    func body(content: Content) -> some View {
        MavisMotionReader { visible in
            content.joltBind(surface.values)
                .background(MavisMotionSurfaceAnchor(surface: surface))
                .onAppear { surface.environment(reduced: reduced || asked, visible: visible) }
                .onChange(of: [visible, reduced, asked]) { _, _ in surface.environment(reduced: reduced || asked, visible: visible) }
        }
    }
}
struct MavisMotionSurfaceAnchor: NSViewRepresentable {
    let surface: MavisMotionPresentation
    func makeNSView(context: Context) -> Anchor { Anchor(surface) }
    func updateNSView(_ view: Anchor, context: Context) { view.refresh(surface) }
    static func dismantleNSView(_ view: Anchor, coordinator: ()) { view.surface?.detach(view) }
    @MainActor final class Anchor: NSView {
        var surface: MavisMotionPresentation?
        init(_ surface: MavisMotionPresentation) { self.surface = surface; super.init(frame: .zero) }
        required init?(coder: NSCoder) { fatalError("Not supported") }
        override func hitTest(_ point: NSPoint) -> NSView? { nil }
        override func viewDidMoveToWindow() { super.viewDidMoveToWindow(); publish() }
        func refresh(_ next: MavisMotionPresentation) {
            if surface !== next { surface?.detach(self); surface = next }
            publish()
        }
        private func publish() {
            guard let surface else { return }
            DispatchQueue.main.async { [weak self, weak surface] in
                guard let self, let surface, self.surface === surface else { return }
                if self.window != nil { surface.attach(self) } else { surface.detach(self) }
            }
        }
    }
}
extension View {
    func mavisMotionSurface(_ surface: MavisMotionSurface) -> some View { modifier(MavisMotionSurfaceBinding(surface: surface)) }
}`,
}
