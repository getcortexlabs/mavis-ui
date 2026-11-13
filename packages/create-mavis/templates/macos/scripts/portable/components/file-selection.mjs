// The public controller types stay intact in shared sources. Its platform resource is never
// lowered to a file path or to serializable metadata; only FileItem crosses that boundary.
export const fileSelectionTypes = `type FileItem = {
  readonly id: string; readonly name: string; readonly size?: number; readonly type?: string
  readonly status: 'selected' | 'uploading' | 'uploaded' | 'failed' | 'cancelled'
  readonly progress?: number; readonly error?: string
}
type FileSelectionFailure = { readonly code: 'picker' | 'type' | 'size' | 'count'; readonly message: string }
type FileSelectionState = { readonly items: readonly FileItem[]; readonly picking: boolean; readonly error?: FileSelectionFailure }
interface FileHandle { readonly __mavisFileHandle: never }
interface FileCancellation { readonly cancelled: boolean; onCancel(callback: () => void): () => void }
interface SelectedFile { readonly name: string; readonly size?: number; readonly type?: string; readonly handle: FileHandle; preview?(): Promise<unknown>; release(): void }
interface FileSelectionRequest { readonly multiple: boolean; readonly accept: readonly string[] }
interface FilePickerAdapter { pick(request: FileSelectionRequest, cancellation: FileCancellation): Promise<readonly SelectedFile[] | null> }
interface FileUploadContext { readonly item: FileItem; readonly handle: FileHandle; readonly cancellation: FileCancellation; progress(loaded: number, total?: number): void }
type FileUpload = (context: FileUploadContext) => Promise<void>
interface FileSelectionOptions { initial?: readonly FileItem[]; multiple?: boolean; accept?: readonly string[]; maxCount?: number; maxSize?: number; upload?: FileUpload }
interface FileSelectionController {
  readonly state: FileSelectionState; readonly canUpload: boolean
  subscribe(listener: (state: FileSelectionState) => void): () => void
  select(picker: FilePickerAdapter): Promise<void>; cancelSelection(): void
  hasFile(id: string): boolean; preview(id: string): unknown; discardPreview(id: string): void
  upload(id: string): Promise<void>; retry(id: string): Promise<void>; cancel(id: string): void
  remove(id: string): void; clear(): void; pause(): void; dispose(): void
}
declare function useFileSelection(options?: FileSelectionOptions): FileSelectionController
declare module '@getcortexlabs/mavis-core/vue' {
  export function useFileSelection(options?: FileSelectionOptions): FileSelectionController
}`

export const fileSelectionRuntime = {
  swiftRuntime: () => `import UniformTypeIdentifiers
import ImageIO

struct MavisFileDescriptor: Identifiable, Equatable {
    let id: String
    let name: String
    var size: Double? = nil
    var type: String? = nil
    var status = "selected"
    var progress: Double? = nil
    var error: String? = nil
}

struct MavisFileFailure: Equatable {
    let code: String
    let message: String
}

/// Platform-only identity. This never appears in FileItem or a persistence snapshot.
@MainActor final class MavisFileHandle {
    fileprivate let url: URL
    private var available = true
    fileprivate init(_ url: URL) { self.url = url }
    fileprivate func invalidate() { available = false }
    /// Host transport borrows access for its own operation; the resource owner can cancel and
    /// release its selection while the transport unwinds. This URL never enters shared state.
    func withFileURL<Value>(_ operation: (URL) async throws -> Value) async throws -> Value {
        guard available else { throw MavisFailure(message: "This Mac file handle is unavailable or has been released") }
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        return try await operation(url)
    }
}

@MainActor final class MavisSelectedFile {
    let handle: MavisFileHandle
    let name: String
    let size: Double?
    let type: String?
    private let scoped: Bool
    private var released = false

    init(_ url: URL) throws {
        let scoped = url.startAccessingSecurityScopedResource()
        do {
            let metadata = try url.resourceValues(forKeys: [.isRegularFileKey, .fileSizeKey, .contentTypeKey])
            guard metadata.isRegularFile == true else { throw CocoaError(.fileReadUnsupportedScheme) }
            self.handle = MavisFileHandle(url)
            self.name = url.lastPathComponent
            self.size = metadata.fileSize.map(Double.init)
            self.type = metadata.contentType?.preferredMIMEType
            self.scoped = scoped
        } catch {
            if scoped { url.stopAccessingSecurityScopedResource() }
            throw error
        }
    }

    func release() {
        guard !released else { return }
        released = true
        handle.invalidate()
        if scoped { handle.url.stopAccessingSecurityScopedResource() }
    }

    func preview() -> NSImage? {
        guard !released, type?.hasPrefix("image/") == true,
              let source = CGImageSourceCreateWithURL(handle.url as CFURL, nil),
              let image = CGImageSourceCreateThumbnailAtIndex(source, 0, [kCGImageSourceCreateThumbnailFromImageAlways: true, kCGImageSourceThumbnailMaxPixelSize: 160] as CFDictionary) else { return nil }
        return NSImage(cgImage: image, size: .zero)
    }
}

struct MavisFileSnapshot {
    let items: [MavisFileDescriptor]
    let picking: Bool
    let error: MavisFileFailure?
}

@MainActor final class MavisFileCancellation {
    private(set) var cancelled = false
    private var callbacks: [(UUID, () throws -> Void)] = []
    func onCancel(_ callback: @escaping () throws -> Void) throws -> @MainActor () -> Void {
        let id = UUID()
        if cancelled { try callback() } else { callbacks.append((id, callback)) }
        return { [weak self] in self?.callbacks.removeAll { $0.0 == id } }
    }
    fileprivate func cancel() {
        guard !cancelled else { return }
        cancelled = true
        let pending = callbacks
        callbacks = []
        for (_, callback) in pending { try? callback() }
    }
}

@MainActor struct MavisFileUploadContext {
    let item: MavisFileDescriptor
    let handle: MavisFileHandle
    let cancellation: MavisFileCancellation
    private let report: (Double, Double?) throws -> Void
    init(item: MavisFileDescriptor, handle: MavisFileHandle, cancellation: MavisFileCancellation, report: @escaping (Double, Double?) throws -> Void) {
        self.item = item; self.handle = handle; self.cancellation = cancellation; self.report = report
    }
    func progress(_ loaded: Double, _ total: Double? = nil) throws { try report(loaded, total) }
}

private struct MavisFileUploadFailure: LocalizedError {
    var errorDescription: String? { "Upload progress needs nonnegative loaded bytes and a positive total" }
}

/// Adapt the app snapshot without nesting its retained closure inside a capture list.
@MainActor func mavisFileSubscription<State>(
    _ receive: @escaping @MainActor (State) -> Void,
    map: @escaping @MainActor (MavisFileSnapshot) -> State
) -> MavisFileSelection.Listener {
    { snapshot in receive(map(snapshot)) }
}

/// Owns file access for one component identity. Every picker/drop completion is checked against
/// its operation token, so cancellation, replacement and disposal cannot reintroduce resources.
@MainActor final class MavisFileSelection: ObservableObject {
    @Published private(set) var items: [MavisFileDescriptor]
    @Published private(set) var picking = false
    @Published private(set) var error: MavisFileFailure?
    @Published private var previews: [String: NSImage] = [:]
    let multiple: Bool
    let accept: [String]
    let maxCount: Double
    let maxSize: Double?
    typealias Upload = @MainActor (MavisFileUploadContext) async throws -> Void
    private(set) var canUpload: Bool
    private var uploadHandler: Upload?
    private var uploads: [String: MavisFileCancellation] = [:]
    typealias Listener = @MainActor (MavisFileSnapshot) -> Void
    private var listeners: [(UUID, Listener)] = []
    var snapshot: MavisFileSnapshot { MavisFileSnapshot(items: items, picking: picking, error: error) }

    func setUpload(_ upload: @escaping Upload) { if !disposed { uploadHandler = upload } }
    func subscribe(_ listener: @escaping Listener) -> @MainActor () -> Void {
        let id = UUID()
        if !disposed { listeners.append((id, listener)) }
        return { [weak self] in self?.listeners.removeAll { $0.0 == id } }
    }
    private func notify() {
        guard !disposed else { return }
        let value = snapshot
        for (_, listener) in listeners { listener(value) }
    }
    private func update(_ id: String, _ change: (inout MavisFileDescriptor) -> Void) {
        guard !disposed else { return }
        if let index = items.firstIndex(where: { $0.id == id }) { change(&items[index]) }
        notify()
    }
    private var disposed = false
    private var operation: UUID?
    private var panel: NSOpenPanel?
    private var resources: [String: MavisSelectedFile] = [:]
    private var ids: Set<String>
    private var nextId = 0

    init(initial: [MavisFileDescriptor] = [], multiple: Bool = false, accept: [String] = [], maxCount: Double? = nil, maxSize: Double? = nil, hasUpload: Bool = false) {
        let count = maxCount ?? (multiple ? 10 : 1)
        precondition(count.isFinite && count.rounded() == count && count >= 1, "File maxCount must be a positive integer")
        precondition(maxSize == nil || (maxSize!.isFinite && maxSize! >= 0), "File maxSize must be finite and nonnegative")
        precondition(accept.allSatisfy { $0.range(of: #"^(\\.[A-Za-z0-9_.-]+|[A-Za-z0-9_!#$&^.+-]+/(?:[A-Za-z0-9_!#$&^.+-]+|\\*))$"#, options: .regularExpression) != nil }, "File accept must contain extensions or MIME types")
        precondition(Double(initial.count) <= (multiple ? count : 1), "Initial files exceed the selection count")
        precondition(Set(initial.map(\\.id)).count == initial.count && initial.allSatisfy { !$0.id.isEmpty && !mavisTrim($0.name).isEmpty }, "File descriptors need unique IDs and readable names")
        precondition(initial.allSatisfy { $0.size == nil || ($0.size!.isFinite && $0.size! >= 0) }, "File size must be finite and nonnegative")
        precondition(initial.allSatisfy { ["selected", "uploading", "uploaded", "failed", "cancelled"].contains($0.status) }, "Invalid file status")
        precondition(initial.allSatisfy { $0.progress == nil || ($0.progress!.isFinite && $0.progress! >= 0 && $0.progress! <= 1) }, "File progress must be between zero and one")
        self.canUpload = hasUpload
        self.items = initial
        self.multiple = multiple
        self.accept = accept
        self.maxCount = count
        self.maxSize = maxSize
        self.ids = Set(initial.map(\\.id))
    }

    static func accepts(name: String, type: String?, hints: [String]) -> Bool {
        hints.isEmpty || hints.contains { hint in
            let hint = hint.lowercased()
            if hint.hasPrefix(".") { return name.lowercased().hasSuffix(hint) }
            if hint.hasSuffix("/*") { return type?.lowercased().hasPrefix(String(hint.dropLast())) == true }
            return type?.lowercased() == hint
        }
    }

    private var contentTypes: [UTType] {
        let types = accept.compactMap { hint -> UTType? in
            if hint.hasPrefix(".") { return UTType(filenameExtension: String(hint.dropFirst())) }
            switch hint.lowercased() {
            case "image/*": return .image
            case "audio/*": return .audio
            case "video/*": return .movie
            default: return UTType(mimeType: hint)
            }
        }
        // The controller still checks the complete accept list after the system chooser.
        return types.count == accept.count && !types.isEmpty ? types : [.item]
    }

    private func begin() -> UUID? {
        guard !disposed else { return nil }
        cancelSelection()
        let token = UUID()
        operation = token
        picking = true
        error = nil
        notify()
        return token
    }

    func choose(in window: NSWindow?) {
        guard let token = begin() else { return }
        let chooser = NSOpenPanel()
        panel = chooser
        chooser.canChooseDirectories = false
        chooser.canChooseFiles = true
        chooser.allowsMultipleSelection = multiple
        chooser.allowedContentTypes = contentTypes
        let complete: (NSApplication.ModalResponse) -> Void = { [weak self, weak chooser] response in
            MainActor.assumeIsolated {
                guard let self else { return }
                self.receive(response == .OK ? chooser?.urls ?? [] : [], token: token)
            }
        }
        if let window { chooser.beginSheetModal(for: window, completionHandler: complete) }
        else { chooser.begin(completionHandler: complete) }
    }

    func drop(_ providers: [NSItemProvider]) -> Bool {
        let providers = providers.filter { $0.hasItemConformingToTypeIdentifier(UTType.fileURL.identifier) }
        guard !providers.isEmpty, let token = begin() else { return false }
        Task { @MainActor [weak self] in
            var urls: [URL] = []
            for provider in providers {
                let url: URL? = await withCheckedContinuation { continuation in
                    provider.loadItem(forTypeIdentifier: UTType.fileURL.identifier, options: nil) { item, _ in
                        let url = (item as? URL) ?? (item as? Data).flatMap { URL(dataRepresentation: $0, relativeTo: nil) }
                        continuation.resume(returning: url?.isFileURL == true ? url : nil)
                    }
                }
                guard let self, !self.disposed, self.operation == token else { return }
                guard let url else {
                    self.finish(token, failure: MavisFileFailure(code: "picker", message: "Unable to select files"))
                    return
                }
                urls.append(url)
            }
            self?.receive(urls, token: token)
        }
        return true
    }

    private func receive(_ urls: [URL], token: UUID) {
        guard !disposed, operation == token else { return }
        guard !urls.isEmpty else { finish(token); return }
        var files: [MavisSelectedFile] = []
        var retained = false
        defer { if !retained { files.forEach { $0.release() } } }
        do {
            for url in urls { files.append(try MavisSelectedFile(url)) }
        } catch {
            finish(token, failure: MavisFileFailure(code: "picker", message: error.localizedDescription))
            return
        }
        let count = multiple ? items.count + files.count : files.count
        var failure: MavisFileFailure?
        if Double(count) > (multiple ? maxCount : 1) {
            failure = MavisFileFailure(code: "count", message: "Choose at most \\(mavisString(multiple ? maxCount : 1)) files")
        } else if files.contains(where: { mavisTrim($0.name).isEmpty || !Self.accepts(name: $0.name, type: $0.type, hints: accept) }) {
            failure = MavisFileFailure(code: "type", message: "This file type is not accepted")
        } else if files.contains(where: { file in file.size.map { !$0.isFinite || $0 < 0 || (maxSize != nil && $0 > maxSize!) } ?? false }) {
            failure = MavisFileFailure(code: "size", message: "A file exceeds the size limit")
        }
        if let failure { finish(token, failure: failure); return }
        if !multiple { for item in items { forget(item.id) } }
        var additions: [MavisFileDescriptor] = []
        for file in files {
            var id: String
            repeat { nextId += 1; id = "file-\\(nextId)" } while ids.contains(id)
            ids.insert(id)
            resources[id] = file
            additions.append(MavisFileDescriptor(id: id, name: file.name, size: file.size, type: file.type))
        }
        retained = true
        items = multiple ? items + additions : additions
        notify()
        for item in additions {
            Task { @MainActor [weak self] in
                guard let self, !self.disposed, let file = self.resources[item.id], let preview = file.preview(), !self.disposed, self.resources[item.id] === file else { return }
                self.previews[item.id] = preview
                self.notify()
            }
        }
        finish(token)
    }

    private func finish(_ token: UUID, failure: MavisFileFailure? = nil) {
        guard !disposed, operation == token else { return }
        if let failure { error = failure; notify() }
        guard !disposed, operation == token else { return }
        operation = nil
        panel = nil
        picking = false
        notify()
    }

    func cancelSelection() {
        let active = operation != nil
        operation = nil
        let previous = panel
        panel = nil
        previous?.cancel(nil)
        if active && !disposed { picking = false; notify() }
    }
    func hasFile(_ id: String) -> Bool { resources[id] != nil }
    func preview(_ id: String) -> NSImage? { previews[id] }
    func discardPreview(_ id: String) { if !disposed { previews[id] = nil; notify() } }
    func cancel(_ id: String) {
        guard let operation = uploads.removeValue(forKey: id) else { return }
        operation.cancel()
        update(id) { $0.status = "cancelled"; $0.progress = nil; $0.error = nil }
    }
    func upload(_ id: String) async {
        guard !disposed, let file = resources[id], let item = items.first(where: { $0.id == id }), let send = uploadHandler, uploads[id] == nil, item.status != "uploaded" else { return }
        let operation = MavisFileCancellation()
        uploads[id] = operation
        func current() -> Bool { !disposed && uploads[id] === operation && resources[id] === file }
        update(id) { $0.status = "uploading"; $0.progress = nil; $0.error = nil }
        do {
            try await send(MavisFileUploadContext(item: item, handle: file.handle, cancellation: operation) { [weak self] loaded, total in
                guard let self, !self.disposed, self.uploads[id] === operation, self.resources[id] === file else { return }
                guard loaded.isFinite, loaded >= 0, total == nil || (total!.isFinite && total! > 0) else { throw MavisFileUploadFailure() }
                self.update(id) { $0.progress = total.map { Swift.min(1, loaded / $0) } }
            })
            if current() { update(id) { $0.status = "uploaded"; $0.progress = 1; $0.error = nil } }
        } catch {
            if current() { update(id) { $0.status = "failed"; $0.error = (error as? MavisFailure)?.message ?? (error as? LocalizedError)?.errorDescription ?? error.localizedDescription } }
        }
        if uploads[id] === operation { uploads[id] = nil }
    }
    func retry(_ id: String) async { await upload(id) }
    private func forget(_ id: String) {
        cancel(id)
        resources.removeValue(forKey: id)?.release()
        previews[id] = nil
    }
    func remove(_ id: String) {
        guard !disposed else { return }
        forget(id)
        items.removeAll { $0.id == id }
        error = nil
        notify()
    }
    func clear() {
        guard !disposed else { return }
        cancelSelection()
        for id in Array(resources.keys) { forget(id) }
        items = []
        error = nil
        notify()
    }
    func pause() {
        cancelSelection()
        for id in Array(uploads.keys) { cancel(id) }
    }
    func dispose() {
        guard !disposed else { return }
        disposed = true
        cancelSelection()
        for id in Array(uploads.keys) { cancel(id) }
        uploadHandler = nil
        listeners = []
        resources.values.forEach { $0.release() }
        resources = [:]
        previews = [:]
    }
}`,
}
