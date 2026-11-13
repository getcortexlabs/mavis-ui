// The asynchronous search policy of core/combobox.ts. A host owns networking and cancellation;
// the field owns request identity, one cached page, debounce and publication of current results.
export const comboboxSearchRuntime = {
  swiftRuntime: () => `@MainActor final class MavisComboboxSearchContext {
    let requestId: Double
    let limit: Double
    private var cancelled = false
    private var cleanups: [() throws -> Void] = []

    init(requestId: Double, limit: Double) { self.requestId = requestId; self.limit = limit }
    func onCancel(_ cleanup: @escaping () throws -> Void) {
        if cancelled { try? cleanup() } else { cleanups.append(cleanup) }
    }
    fileprivate func completed() { cleanups = [] }
    fileprivate func cancel() {
        guard !cancelled else { return }
        cancelled = true
        let previous = cleanups
        cleanups = []
        for cleanup in previous { try? cleanup() }
    }
}

private struct MavisComboboxSearchFailure: Error {}

@MainActor final class MavisComboboxSearch: ObservableObject {
    typealias Search = @MainActor (String, MavisComboboxSearchContext) async throws -> [MavisChoice]
    @Published private(set) var state: MavisComboboxPage
    private var cached: MavisComboboxPage?
    private var generation: Double = 0
    private var disposed = false
    private var waiting: Task<Void, Never>?
    private var context: MavisComboboxSearchContext?
    private var debounce: Double
    private var minQueryLength: Double
    private var maxResults: Double

    init(initialResults: (query: String, options: [MavisChoice])? = nil, debounce: Double = 200, minQueryLength: Double = 1, maxResults: Double = 50) {
        Self.validate(debounce: debounce, minQueryLength: minQueryLength, maxResults: maxResults)
        self.debounce = debounce
        self.minQueryLength = minQueryLength
        self.maxResults = maxResults
        if let initialResults {
            precondition(Self.valid(initialResults.options), "Combobox initial options must have unique values and nonempty labels.")
            let initial = MavisComboboxPage(query: initialResults.query, options: initialResults.options, limit: maxResults)
            self.state = initial
            self.cached = initial
        } else { self.state = MavisComboboxPage() }
    }

    private static func validate(debounce: Double, minQueryLength: Double, maxResults: Double) {
        precondition(debounce.isFinite && debounce.rounded() == debounce && debounce >= 0 && debounce <= 60_000, "Combobox debounce must be an integer from 0 to 60000 milliseconds.")
        precondition(minQueryLength.isFinite && minQueryLength.rounded() == minQueryLength && minQueryLength >= 0 && minQueryLength <= 1_000, "Combobox minQueryLength must be an integer from 0 to 1000.")
        precondition(maxResults.isFinite && maxResults.rounded() == maxResults && maxResults >= 1 && maxResults <= 100, "Combobox maxResults must be an integer from 1 to 100.")
    }

    func configure(initialResults: (query: String, options: [MavisChoice])?, debounce: Double, minQueryLength: Double, maxResults: Double) {
        guard !disposed, debounce != self.debounce || minQueryLength != self.minQueryLength || maxResults != self.maxResults else { return }
        Self.validate(debounce: debounce, minQueryLength: minQueryLength, maxResults: maxResults)
        invalidate()
        self.debounce = debounce
        self.minQueryLength = minQueryLength
        self.maxResults = maxResults
        if let initialResults {
            precondition(Self.valid(initialResults.options), "Combobox initial options must have unique values and nonempty labels.")
            let initial = MavisComboboxPage(query: initialResults.query, options: initialResults.options, limit: maxResults)
            state = initial
            cached = initial
        } else { state = MavisComboboxPage(); cached = nil }
    }

    deinit {
        waiting?.cancel()
        let previous = context
        Task { @MainActor in previous?.cancel() }
    }

    private static func valid(_ options: [MavisChoice]) -> Bool {
        Set(options.map(\\.value)).count == options.count && options.allSatisfy { !mavisTrim($0.label).isEmpty }
    }
    private func invalidate() {
        generation += 1
        waiting?.cancel()
        waiting = nil
        let previous = context
        context = nil
        previous?.cancel()
    }
    func cancel() {
        invalidate()
        if !disposed && ["loading", "debouncing"].contains(state.status) { state = MavisComboboxPage(query: state.query) }
    }
    func dispose() {
        guard !disposed else { return }
        disposed = true
        invalidate()
        cached = nil
    }
    func request(_ query: String, force: Bool = false, search: @escaping Search) {
        guard !disposed else { return }
        invalidate()
        if !force, let cached, cached.query == query { state = cached; return }
        guard Double(mavisTrim(query).utf16.count) >= minQueryLength else { state = MavisComboboxPage(query: query); return }
        let identity = generation
        let delay = !force ? debounce : 0
        let context = MavisComboboxSearchContext(requestId: identity, limit: maxResults)
        self.context = context
        state = MavisComboboxPage(query: query, status: delay > 0 ? "debouncing" : "loading")
        // The operation captures the host callback and its token, never this controller strongly
        // across await. Releasing the field can dispose it while the transport is still pending.
        waiting = Task { @MainActor [weak self] in
            if delay > 0 {
                do { try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000)) } catch { return }
            }
            guard self?.current(identity) == true else { return }
            self?.state = MavisComboboxPage(query: query, status: "loading")
            do {
                let options = try await search(query, context)
                guard let self, self.current(identity) else { return }
                guard Self.valid(options) else { throw MavisComboboxSearchFailure() }
                let next = MavisComboboxPage(query: query, options: options, limit: self.maxResults)
                context.completed()
                self.waiting = nil
                self.cached = next
                self.state = next
            } catch {
                guard let self, self.current(identity) else { return }
                context.completed()
                self.waiting = nil
                self.state = MavisComboboxPage(query: query, status: "error")
            }
        }
    }
    private func current(_ identity: Double) -> Bool { !disposed && generation == identity }
    func retry(search: @escaping Search) { request(state.query, force: true, search: search) }
}`,
}
