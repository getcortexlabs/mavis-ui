import SwiftUI

extension __FIXTURE__ {
    @MainActor final class NativeSearchProbe: SearchProbe {
        private func pause(_ milliseconds: UInt64) async {
            await withCheckedContinuation { continuation in
                DispatchQueue.main.asyncAfter(deadline: .now() + Double(milliseconds) / 1000) { continuation.resume() }
            }
        }
        private func option(_ value: String) -> MavisChoice { MavisChoice(value: value, label: value, disabled: false, helperText: "") }
        func run() async throws -> String {
            var checks = 0
            func check(_ value: Bool) throws {
                if !value { throw MavisFailure(message: "Search check \(checks + 1)") }
                checks += 1
            }
            var calls = 0
            let cached = MavisComboboxSearch(initialResults: (query: "saved", options: [option("saved")]))
            cached.request("saved") { _, _ in calls += 1; return [] }
            try check(calls == 0 && cached.state.options.first?.value == "saved")
            cached.dispose()

            let delayed = MavisComboboxSearch(debounce: 30)
            delayed.request("a") { _, _ in calls += 1; return [] }
            delayed.cancel(); await pause(50)
            try check(calls == 0 && delayed.state.status == "idle"); delayed.dispose()

            var cancelled = 0
            let stale = MavisComboboxSearch(debounce: 0)
            let answer: MavisComboboxSearch.Search = { query, context in
                context.onCancel { cancelled += 1 }
                await self.pause(query == "old" ? 80 : 5)
                return [self.option(query)]
            }
            stale.request("old", search: answer); await pause(2)
            stale.request("new", search: answer); await pause(100)
            try check(cancelled == 1 && stale.state.options.first?.value == "new"); stale.dispose()

            var cleanups = 0
            let cleanup = MavisComboboxSearch(debounce: 0)
            cleanup.request("a") { _, context in
                context.onCancel { cleanups += 1; throw MavisFailure(message: "Broken host cleanup") }
                context.onCancel { cleanups += 1 }
                await self.pause(20)
                context.onCancel { cleanups += 1 }
                return []
            }
            await pause(2); cleanup.cancel(); await pause(40)
            try check(cleanups == 3 && cleanup.state.status == "idle"); cleanup.dispose()

            var attempts = 0
            let retry = MavisComboboxSearch(debounce: 0)
            let retried: MavisComboboxSearch.Search = { _, _ in
                attempts += 1
                if attempts == 1 { throw MavisFailure(message: "Offline") }
                return [self.option("retried")]
            }
            retry.request("a", search: retried); await pause(5)
            let failed = retry.state.status == "error"
            retry.retry(search: retried); await pause(5)
            try check(failed && attempts == 2 && retry.state.options.first?.value == "retried"); retry.dispose()

            let bounded = MavisComboboxSearch(debounce: 0, maxResults: 2)
            bounded.request("a") { _, _ in [self.option("a"), self.option("b"), self.option("c")] }
            await pause(5)
            try check(bounded.state.limited && bounded.state.options.count == 2); bounded.dispose()

            var disposed = 0
            let gone = MavisComboboxSearch(debounce: 0)
            let late: MavisComboboxSearch.Search = { _, context in
                context.onCancel { disposed += 1 }; await self.pause(20); return [self.option("late")]
            }
            gone.request("a", search: late); await pause(2); gone.dispose()
            gone.request("b", search: late); await pause(40)
            try check(disposed == 1 && gone.state.query == "a" && gone.state.options.isEmpty)

            let invalid = MavisComboboxSearch(debounce: 0)
            invalid.request("a") { _, _ in [self.option("a"), self.option("a")] }
            await pause(5)
            try check(invalid.state.status == "error"); invalid.dispose()
            return "\(checks) search checks passed"
        }
    }
    @MainActor static func services() -> MavisServices { MavisServices(searchProbe: NativeSearchProbe()) }
}
