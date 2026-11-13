import SwiftUI
import UniformTypeIdentifiers
extension __FIXTURE__ {
    @MainActor final class NativeUploads: UploadService {
        private let directory = FileManager.default.temporaryDirectory.appendingPathComponent("mavis-upload-" + UUID().uuidString)
        private var attempts = 0
        deinit { try? FileManager.default.removeItem(at: directory) }
        private func pause() async { await withCheckedContinuation { continuation in DispatchQueue.main.asyncAfter(deadline: .now() + 0.03) { continuation.resume() } } }
        func select(_ files: MavisFileSelection) async throws {
            // Give the source a real retained resource through the same drop path as the control.
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            let selected = directory.appendingPathComponent("notes.txt")
            try Data(repeating: 65, count: 64).write(to: selected)
            guard files.drop([NSItemProvider(item: selected as NSURL, typeIdentifier: UTType.fileURL.identifier)]) else { throw MavisFailure(message: "Selection refused") }
            for _ in 0..<50 { if !files.picking { return }; await pause() }
            throw MavisFailure(message: "Selection timed out")
        }
        func upload(_ context: MavisFileUploadContext) async throws {
            try await context.handle.withFileURL { url in
                let bytes = try Data(contentsOf: url)
                try context.progress(0, Double(bytes.count))
                await pause()
                attempts += 1
                if attempts == 1 { throw MavisFailure(message: "Offline") }
                try context.progress(Double(bytes.count), Double(bytes.count))
                await pause()
            }
        }
    }
    @MainActor static func services() -> MavisServices { MavisServices(uploadService: NativeUploads()) }
}
