// Runtime of the format-neutral motion surface. Jolt owns timing, sampled values, ownership
// and projection. Mavis owns presentation attachment and the shared playback vocabulary.
export const motionSurfaceRuntime = {
  swiftRuntime:
    () => `enum MavisMotionFailure: Error { case unavailable, invalidFrames, invalidOptions }
struct MavisMotionOptions {
    var type = "spring"
    var duration: Double? = nil
    var bounce: Double? = nil
    var ease = "easeOut"
    var delay: Double = 0
    func transition() throws -> JoltTransition {
        guard delay.isFinite, delay >= 0, delay <= 60000 else { throw MavisMotionFailure.invalidOptions }
        switch type {
        case "spring": return try .spring(milliseconds: duration ?? 600, bounce: bounce ?? 0.2)
        case "tween":
            let curve: JoltEase
            switch ease { case "linear": curve = .linear; case "easeIn": curve = .easeIn; case "easeOut": curve = .easeOut; case "easeInOut": curve = .easeInOut; default: throw MavisMotionFailure.invalidOptions }
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
        if suspended { next.suspend() }
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
    private var setups: [UUID: () -> Void] = [:]
    private var observers: [UUID: () -> Void] = [:]
    private weak var attachment: NSView?
    private(set) var reduced = false
    private(set) var suspended = false
    private var disposed = false
    func attach(_ view: NSView) {
        guard !disposed else { return }
        precondition(attachment == nil || attachment === view, "One motion surface cannot bind to multiple views")
        attachment = view
        guard !available else { return }
        available = true
        for setup in Array(setups.values) { setup() }
        for observe in Array(observers.values) { observe() }
    }
    func detach(_ view: NSView) {
        guard attachment === view else { return }
        attachment = nil
        available = false
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
    func onAvailable(_ setup: @escaping () -> Void) {
        guard !disposed else { return }
        setups[UUID()] = setup
        if available { setup() }
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
        let active = Array(playbacks.values); playbacks.removeAll()
        for playback in active { playback.dispose() }
        disposeResources()
        for observe in Array(observers.values) { observe() }
        observers.removeAll()
    }
}
@MainActor final class MavisMotionSurface: MavisMotionPresentation {
    let values: [JoltValueProperty: JoltMotionValue]
    override init() {
        values = Dictionary(uniqueKeysWithValues: JoltValueProperty.allCases.map { property in
            (property, try! JoltMotionValue([.scale,.scaleX,.scaleY,.opacity].contains(property) ? 1 : 0))
        })
        super.init()
    }
    override func resetPresentation() {
        for (property, value) in values { try? value.set([.scale,.scaleX,.scaleY,.opacity].contains(property) ? 1 : 0) }
    }
    override func disposeResources() { for value in values.values { value.dispose() } }
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
        let transition = try options.transition()
        return try frames.map { name, frames in
            guard let property = JoltValueProperty(rawValue: name), let target = values[property], (1...2).contains(frames.count), let last = frames.last!, last.isFinite, frames.dropLast().allSatisfy({ $0 == nil || $0!.isFinite }) else { throw MavisMotionFailure.invalidFrames }
            return JoltTimelineTrack(target, to: last, from: frames.count == 2 ? frames[0] : nil, at: at + options.delay, transition: transition)
        }
    }
    @discardableResult func animate(_ frames: [String: [Double?]], options: MavisMotionOptions = .init()) throws -> MavisMotionPlayback {
        let tracks = try tracks(frames, options: options)
        return try play(tracks)
    }
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
