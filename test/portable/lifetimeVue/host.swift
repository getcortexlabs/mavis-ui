import SwiftUI

extension __FIXTURE__ {
    @MainActor final class PendingWork: DeferredWork {
        private var pending: [CheckedContinuation<String, Never>] = []
        private var cancelled = false
        func load() async throws -> String {
            cancelled = false
            return await withCheckedContinuation { pending.append($0) }
        }
        func cancel() { cancelled = true }
        func finish() {
            let completed = pending
            pending = []
            for continuation in completed {
                continuation.resume(returning: cancelled ? "Late result" : "Loaded")
            }
        }
    }
    @MainActor static func services() -> MavisServices {
        MavisServices(deferredWork: PendingWork())
    }
}
