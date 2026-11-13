import SwiftUI
import UniformTypeIdentifiers
extension __FIXTURE__ {
    @MainActor final class NativeFileProbe: FileProbe {
        private func pause(_ milliseconds: UInt64) async {
            await withCheckedContinuation { continuation in DispatchQueue.main.asyncAfter(deadline: .now() + Double(milliseconds) / 1000) { continuation.resume() } }
        }
        private func until(_ predicate: () -> Bool) async throws {
            for _ in 0..<100 { if predicate() { return }; await pause(2) }
            throw MavisFailure(message: "Upload timed out")
        }
        private func choose(_ selection: MavisFileSelection, _ directory: URL, _ name: String = "notes.txt") async throws {
            let url = directory.appendingPathComponent(name)
            try Data(repeating: 65, count: 64).write(to: url)
            let provider = NSItemProvider(item: url as NSURL, typeIdentifier: UTType.fileURL.identifier)
            guard selection.drop([provider]) else { throw MavisFailure(message: "Drop rejected") }
            for _ in 0..<100 { if !selection.picking { return }; await pause(2) }
            throw MavisFailure(message: "Drop timed out")
        }
        func run() async throws -> String {
            let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            defer { try? FileManager.default.removeItem(at: directory) }
            var checks = 0
            func check(_ value: Bool) throws { if !value { throw MavisFailure(message: "File check \(checks + 1)") }; checks += 1 }
            var sent = 0
            let metadata = MavisFileSelection(initial: [MavisFileDescriptor(id: "stored", name: "stored.txt", status: "uploaded")], hasUpload: true)
            metadata.setUpload { _ in sent += 1 }
            await metadata.upload("stored")
            try check(!metadata.hasFile("stored") && sent == 0 && metadata.items.first?.status == "uploaded"); metadata.dispose()

            let limits = MavisFileSelection(multiple: true, accept: [".txt"], maxCount: 1, maxSize: 100)
            try await choose(limits, directory); try await choose(limits, directory, "bad.pdf")
            try check(limits.error?.code == "count" && limits.items.count == 1); limits.dispose()

            var complete: () -> Void = {}
            var progressStarted = false
            let progress = MavisFileSelection(hasUpload: true)
            progress.setUpload { context in
                try context.progress(64, 64)
                progressStarted = true
                await withCheckedContinuation { continuation in complete = { continuation.resume() } }
            }
            try await choose(progress, directory)
            let progressTask = Task { await progress.upload("file-1") }; try await until { progressStarted }
            let pending = progress.items.first?.status == "uploading" && progress.items.first?.progress == 1
            complete(); await progressTask.value
            try check(pending && progress.items.first?.status == "uploaded"); progress.dispose()

            var cancelled = 0; var attempts = 0; var late: MavisFileUploadContext?
            var finish: () -> Void = {}
            let cancellation = MavisFileSelection(hasUpload: true)
            cancellation.setUpload { context in
                attempts += 1
                if attempts == 1 {
                    late = context; _ = try context.cancellation.onCancel { cancelled += 1 }
                    await withCheckedContinuation { continuation in finish = { continuation.resume() } }
                }
            }
            try await choose(cancellation, directory)
            let cancelledTask = Task { await cancellation.upload("file-1") }; try await until { late != nil }
            cancellation.cancel("file-1"); try late!.progress(100, 100); finish(); await cancelledTask.value
            let kept = cancelled == 1 && cancellation.hasFile("file-1") && cancellation.items.first?.status == "cancelled" && cancellation.items.first?.progress == nil
            await cancellation.retry("file-1")
            try check(kept && attempts == 2 && cancellation.items.first?.status == "uploaded"); cancellation.dispose()

            var failures = 0
            let retry = MavisFileSelection(hasUpload: true)
            retry.setUpload { _ in defer { failures += 1 }; if failures == 0 { throw MavisFailure(message: "Offline") } }
            try await choose(retry, directory); await retry.upload("file-1")
            let failed = retry.items.first?.status == "failed" && retry.items.first?.error == "Offline"
            await retry.retry("file-1")
            try check(failed && retry.items.first?.status == "uploaded"); retry.dispose()

            var disposed = 0; var notifications = 0; var last: MavisFileUploadContext?
            var release: () -> Void = {}
            let gone = MavisFileSelection(hasUpload: true)
            gone.setUpload { context in
                last = context; _ = try context.cancellation.onCancel { disposed += 1 }
                await withCheckedContinuation { continuation in release = { continuation.resume() } }
            }
            try await choose(gone, directory); _ = gone.subscribe { _ in notifications += 1 }
            let goneTask = Task { await gone.upload("file-1") }; try await until { last != nil }; let before = notifications
            gone.dispose(); try last!.progress(64, 64); release(); await goneTask.value
            var handleReleased = false
            do { _ = try await last!.handle.withFileURL { _ in true } } catch { handleReleased = true }
            try check(disposed == 1 && notifications == before && !gone.hasFile("file-1") && handleReleased)

            let observed = MavisFileSelection(initial: [MavisFileDescriptor(id: "one", name: "one.txt")])
            var snapshots = 0; var size = -1
            let unsubscribe = observed.subscribe { state in snapshots += 1; size = state.items.count }
            let silent = snapshots == 0
            observed.remove("one"); unsubscribe(); observed.clear()
            try check(silent && snapshots == 1 && size == 0); observed.dispose()
            return "\(checks) file checks passed"
        }
    }
    @MainActor static func services() -> MavisServices { MavisServices(fileProbe: NativeFileProbe()) }
}
